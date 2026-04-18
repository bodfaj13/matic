# Smart Triage

Monorepo for **Smart Triage**: support ticketing with LLM-assisted classification (backend) and a Next.js staff UI (frontend).

## Packages

| Directory | Stack | README |
| --------- | ----- | ------ |
| [backend/](backend/) | NestJS, MongoDB, Redis (BullMQ), OpenAI | [backend/README.md](backend/README.md) |
| [frontend/](frontend/) | Next.js (App Router), React, TypeScript, Tailwind | [frontend/README.md](frontend/README.md) |

## Quick links

- [backend/README.md](backend/README.md) — API setup, routes, response shapes, Codematic verification
- [backend/AI_JOURNEY.md](backend/AI_JOURNEY.md) — backend AI-assisted development notes
- [frontend/README.md](frontend/README.md) — frontend setup, env, scripts, Codematic verification
- [frontend/AI_JOURNEY.md](frontend/AI_JOURNEY.md) — frontend AI-assisted development notes

## Local full stack

### Run with Docker (one command)

Requires Docker Desktop or any Docker engine with the `compose` plugin.

```bash
cp .env.docker.example .env
# (optional) set OPENAI_API_KEY in .env so triage actually classifies
docker compose up --build
```

That brings up four services on a single network:

| Service | URL / port | What it is |
|---|---|---|
| `frontend` | [http://localhost:3000](http://localhost:3000) | Next.js staff UI |
| `backend` | [http://localhost:3001/api/v1](http://localhost:3001/api/v1) | NestJS API (Swagger at `/api/v1/docs`) |
| `mongo` | `localhost:27017` | MongoDB 7 (data persisted in the `mongo-data` named volume) |
| `redis` | `localhost:6379` | Redis 7 (BullMQ broker for async triage) |

The frontend image is built with `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001` baked into the bundle (so the browser reaches the host-mapped backend), and runs with `API_BASE_URL=http://backend:3000` set so server-side fetches (e.g. [`app/api/register-proxy`](frontend/app/api/register-proxy/route.ts)) reach the backend over the docker network. See [docker-compose.yml](docker-compose.yml) for the full wiring.

First build takes ~2-3 min (npm installs + Next build); subsequent runs reuse the layer cache. To wipe ticket data between runs, `docker compose down -v`.

### Run without Docker

1. Start MongoDB and Redis, configure and run the API from `backend/` (see backend README). Use a dedicated API port (e.g. `3001`) if the Next dev server uses `3000`.
2. From `frontend/`, copy `.env.example` to `.env.local`, set `NEXT_PUBLIC_API_BASE_URL` to match the API (and `AGENT_REGISTRATION_SECRET` if you use agent self-registration via `app/api/register-proxy`), then `npm install` and `npm run dev`.

---

## Verification (Codematic)

### 1. RBAC if "Admin" and "Read-only" users were added

#### How the guard works today

A request hitting a protected route flows through two NestJS guards in order:

1. **`JwtAuthGuard`** ([`src/auth/jwt-auth.guard.ts`](backend/src/auth/jwt-auth.guard.ts)) — extracts the bearer token from the `Authorization` header, verifies the signature with `JWT_SECRET`, and on success attaches the decoded payload (`{ sub, email, role }`) to `request.user`. The payload type is [`JwtPayload`](backend/src/auth/jwt.strategy.ts) and is signed at login/register in [`auth.service.ts`](backend/src/auth/auth.service.ts).
2. **`RolesGuard`** ([`src/common/guards/roles.guard.ts`](backend/src/common/guards/roles.guard.ts)) — uses NestJS's `Reflector` to read the `roles` metadata that the **`@Roles(...)`** decorator ([`src/common/decorators/roles.decorator.ts`](backend/src/common/decorators/roles.decorator.ts)) attached to the route handler:

   ```ts
   const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
     context.getHandler(),  // method-level @Roles wins
     context.getClass(),    // …falling back to controller-level @Roles
   ]);
   if (!required?.length) return true;          // route is open to any authenticated user
   const { user } = context.switchToHttp().getRequest();
   if (!user?.role) throw new UnauthorizedException();
   if (!required.includes(user.role)) throw new UnauthorizedException();
   return true;
   ```

   So the rule is simple: **the user's role must appear in the list passed to `@Roles(...)`**. Both guards must return `true` for the controller method to run; either throwing an `UnauthorizedException` short-circuits with `401` before the handler is reached.

A typical usage on the ticket list endpoint ([`tickets.controller.ts`](backend/src/tickets/tickets.controller.ts)):

```ts
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Agent, UserRole.Admin)
@Get()
list(@Query() query: QueryTicketsDto) { … }
```

`POST /api/v1/tickets` (public ticket submission) intentionally has neither guard, which is why customers can create tickets without an account.

#### Extending to Admin + Read-only

1. **Add the role.** Extend [`UserRole`](backend/src/common/enums/user-role.enum.ts) with `Viewer` (read-only) — the JWT payload type picks it up automatically — and gate which registration secret can mint which role in [`auth.service.ts`](backend/src/auth/auth.service.ts) (today `AGENT_REGISTRATION_SECRET` / `ADMIN_REGISTRATION_SECRET`; add a viewer secret or admin-issued invites).
2. **Re-map endpoints with `@Roles(...)`.** `Viewer` on `GET /tickets` only; `Agent` on `GET` + `PATCH`; `Admin` on those plus user-management / queue admin endpoints (e.g. [`/admin/triage-bullmq/stats`](backend/src/admin/triage-bullmq.controller.ts)). Because the guard logic is already a simple "is my role in the allow-list?" check, no guard changes are needed — just decorator updates per route.
3. **Finer control without role explosion.** For one-off permissions (e.g. "can re-run triage"), add a `permissions[]` claim to the JWT and a sibling `PermissionsGuard` that mirrors `RolesGuard` but checks against permission strings; or adopt a small policy table (CASL-style) for resource-level rules.
4. **Mirror on the frontend.** [`useSessionStore`](frontend/lib/stores/session-store.ts) already persists `user.role`, so the UI can hide/disable actions — but the API stays the source of truth: guards run on every request regardless of UI state.
5. **Audit admin-only mutations.** Log role changes, queue purges, and assignments for accountability.

Deeper version with file refs: [backend/README.md#role-based-access-control-rbac](backend/README.md#role-based-access-control-rbac).

### 2. What happens if the OpenAI API goes down

Triage is fully **decoupled** from ticket creation, so an LLM outage never blocks customers or staff:

1. **Submission stays available.** `POST /api/v1/tickets` writes the ticket to MongoDB with `triageStatus: pending` and enqueues a BullMQ job — it never awaits OpenAI inline ([`tickets.service.ts`](backend/src/tickets/tickets.service.ts)).
2. **Background retries with backoff.** The job is enqueued with `attempts: 5` and `backoff: { type: 'exponential', delay: 1000 }`, so transient OpenAI failures self-heal without intervention.
3. **Graceful degradation after exhaustion.** If all retries fail, the worker writes safe defaults — `category: General`, `priority: medium`, `triageStatus: failed` — and stores the error in `triageError` ([`triage.processor.ts`](backend/src/triage/triage.processor.ts)). The ticket still appears in the queue with a visible failure badge ([`TriageStatusBadge`](frontend/features/triage-queue/triage-status-badge.tsx)).
4. **Agent workflows keep working.** `PATCH /api/v1/tickets/:id` only mutates `status` — no LLM call — so agents can triage manually and resolve tickets while OpenAI is down.
5. **Queue visibility.** [`GET /api/v1/admin/triage-bullmq/stats`](backend/src/admin/triage-bullmq.controller.ts) exposes BullMQ counters (waiting / active / failed) so operators can spot a stuck queue.

Deeper version with file refs: [backend/README.md#resiliency-when-the-llm-is-unavailable](backend/README.md#resiliency-when-the-llm-is-unavailable).

### 3. Testing (Zero-Debt Policy — ≥80% on core business logic)

Both packages have Jest test suites with coverage scoped to **business-logic** modules (we exclude UI rendering and bootstrap files so the percentage reflects what the criterion actually targets).

**Backend** ([backend/](backend/)) — Jest already wired:

```bash
cd backend && npm run test:cov
```

Latest run: **54 tests, all passing.** Statement / branch coverage on the core files called out in the brief:

| File | Statements | Branches |
|---|---|---|
| [`src/tickets/tickets.service.ts`](backend/src/tickets/tickets.service.ts) (ticket creation) | 97.22% | 87.5% |
| [`src/triage/openai-triage.service.ts`](backend/src/triage/openai-triage.service.ts) (AI parsing) | 100% | 94.44% |
| [`src/triage/triage.processor.ts`](backend/src/triage/triage.processor.ts) (BullMQ worker + retry/fallback) | 100% | 87.5% |
| [`src/auth/auth.service.ts`](backend/src/auth/auth.service.ts) | 97.29% | 85.71% |
| [`src/common/guards/roles.guard.ts`](backend/src/common/guards/roles.guard.ts) | 100% | 90% |

These specs pin the queue enqueue contract, the LLM JSON-parse / enum-fallback / empty-content / network-error branches, and the BullMQ retry-then-fallback path that gives the system its resiliency.

**Frontend** ([frontend/](frontend/)) — Jest + React Testing Library + `@swc/jest` (config: [jest.config.ts](frontend/jest.config.ts)):

```bash
cd frontend && npm install && npm run test:cov
```

Latest run: **91 tests, all passing.** Coverage scope (`collectCoverageFrom` in [jest.config.ts](frontend/jest.config.ts)) is `lib/**` + `app/utils/**` — the actual business-logic surface, excluding routes, components, and styling tokens.

| Area | Statements | Branches |
|---|---|---|
| [`lib/api/tickets/use-tickets.ts`](frontend/lib/api/tickets/use-tickets.ts) (React Query hooks + optimistic update triad) | 94.59% | 71.42% |
| [`lib/api/tickets/index.ts`](frontend/lib/api/tickets/index.ts) (request functions) | 100% | 100% |
| [`lib/api/auth/`](frontend/lib/api/auth/) (login / register + session wiring) | 100% | 100% |
| [`lib/api/axios.ts`](frontend/lib/api/axios.ts) (Bearer interceptor, 401 handler) | 91.3% | 80% |
| [`lib/api/types.ts`](frontend/lib/api/types.ts) (`getFieldErrorsFromApiResponse` etc.) | 96.15% | 94.73% |
| [`lib/stores/session-store.ts`](frontend/lib/stores/session-store.ts) | 100% | 100% |
| [`lib/enums/`](frontend/lib/enums/), [`lib/utils.ts`](frontend/lib/utils.ts), [`lib/ticket-ref.ts`](frontend/lib/ticket-ref.ts), [`lib/use-debounced-value.ts`](frontend/lib/use-debounced-value.ts) | 100% | 100% |
| [`app/utils/`](frontend/app/utils/) (logger, toast-helpers, format-relative-time) | 100% | 100% |

**Aggregate**: 97.88% statements / 92.07% branches across the scoped surface — comfortably above the 80% bar.

Specs pin the optimistic-update onMutate/onError/onSettled triad we shipped for the kanban (rollback + toast on failure), the API field-error parsing helpers used in form `catch` blocks, the auth flow's session-store wiring, and the env-conditional logger.
