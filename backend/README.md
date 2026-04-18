# Smart Triage

**Smart Triage** is a support ticketing API that ingests customer tickets, classifies them with an LLM (category and priority), and exposes a paginated dashboard for staff. The backend is built with NestJS, MongoDB, Redis (BullMQ), and OpenAI.

## Prerequisites

- Node.js 20+
- MongoDB (local or remote)
- Redis (for BullMQ job processing)

## Quick start

From this directory:

```bash
cp .env.example .env
# Set JWT_SECRET, AGENT_REGISTRATION_SECRET, OPENAI_API_KEY, MONGODB_URI, Redis if needed
npm install
npm run start:dev
```

- API base URL: `http://localhost:3000/api/v1`
- Swagger UI (when enabled): `http://localhost:3000/api/v1/docs`

### Main routes

| Method | Path | Auth |
| ------ | ---- | ---- |
| `POST` | `/api/v1/auth/register` | Header `x-registration-secret` (agent or admin) |
| `POST` | `/api/v1/auth/login` | — |
| `POST` | `/api/v1/tickets` | Public |
| `GET` | `/api/v1/tickets` | JWT — roles `agent` or `admin` |
| `PATCH` | `/api/v1/tickets/:id` | JWT — roles `agent` or `admin` |
| `GET` | `/api/v1/admin/triage-bullmq/stats` | Operational queue visibility |

Environment variables are documented in [.env.example](.env.example).

### Response shape

Runtime payloads follow the TypeScript interfaces in [`src/common/interfaces`](src/common/interfaces) (`BaseResponse`, `PaginatedResponse`). For OpenAPI/Swagger, concrete **response DTO** classes (with `@ApiProperty`) live next to each feature:

- Auth: [`register.response.dto.ts`](src/auth/dto/register.response.dto.ts), [`login.response.dto.ts`](src/auth/dto/login.response.dto.ts)
- Tickets: [`ticket-data.response.dto.ts`](src/tickets/dto/ticket-data.response.dto.ts), [`ticket-envelope.response.dto.ts`](src/tickets/dto/ticket-envelope.response.dto.ts)

#### Auth response notes

- `POST /api/v1/auth/register` returns `201` with `data.access_token` and the created user summary (`id`, `email`, `role`).
- `POST /api/v1/auth/login` returns `200` with `data.access_token` and user summary (`email`, `role`).

## Scripts

```bash
npm install
npm run start:dev    # watch mode
npm run build
npm run test         # unit tests — colocated `*.spec.ts` next to each module
npm run test:e2e     # requires MongoDB + Redis (see Prerequisites above)
npm run lint
```

## API

- Base path: `/api/v1`
- Swagger: `/api/v1/docs` when `NODE_ENV` / `APP_ENV` is `local`, `development`, or `dev`

---

## Verification (Codematic)

### Role-based access control (RBAC)

Today, JWT users carry a **role** (`agent` or `admin`). Route guards allow both roles to list and update tickets.

If **Admins** and **read-only** users were added:

1. **Extend the role model** — e.g. `admin`, `agent`, `viewer` (read-only), stored on the user document and embedded in the JWT payload (or resolved from a `userId` on each request).
2. **Authorize by role + action** — keep route-level guards (`JwtAuthGuard`, `RolesGuard`) and map roles to permissions: `viewer` → `GET /tickets` only; `agent` → `GET` + `PATCH`; `admin` → those plus user management, configuration, or queue admin endpoints.
3. **Optional finer control** — a `permissions[]` claim or a small policy table (e.g. CASL-style) for special cases without exploding the number of roles.
4. **Audit** — log admin actions (ticket reassignment, role changes) for accountability.

### Resiliency when the LLM is unavailable

1. **Ticket creation stays available** — `POST /api/v1/tickets` persists the ticket immediately with `triageStatus: pending` and enqueues a BullMQ job; the client does not depend on OpenAI responding inline.
2. **Retries** — the triage worker retries failed LLM calls with exponential backoff (`attempts` / `backoff` on the queue job).
3. **Graceful degradation** — after retries are exhausted, the worker sets a default category (`General`), default priority (`medium`), `triageStatus: failed`, and stores a short `triageError` so agents still see the ticket and can work it manually.
4. **Agent workflows** — status updates use `PATCH /api/v1/tickets/:id` and do not require the LLM; agents can resolve tickets even when triage failed.

---

## Further reading

- [AI_JOURNEY.md](AI_JOURNEY.md) — AI-assisted development notes (Codematic).
