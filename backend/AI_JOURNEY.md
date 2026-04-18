# AI_JOURNEY — Smart Triage

This document satisfies the Codematic **AI-first workflow**: representative prompts used during development, plus one example of an AI mistake and how it was corrected.

## Complex prompts used

### 1. Mongoose schema, indexes, and ticket lifecycle

> Design a Mongoose schema for a support ticket with `title`, `description`, `customer_email`, `status` (open / in_progress / resolved), `priority` (high / medium / low), `category`, and triage metadata (`triageStatus`: pending / completed / failed, optional `triageError`). Add MongoDB indexes that support filtering by `status` and `priority` and sorting by `createdAt` descending. Use NestJS `@nestjs/mongoose` patterns.

**Outcome:** Defined enums and a `Ticket` schema with compound-friendly indexes on `status`, `priority`, `createdAt`, and `customer_email`.

### 2. BullMQ processor + OpenAI JSON contract

> In NestJS 11 with `@nestjs/bullmq`, implement a `WorkerHost` processor on queue `triage` that loads a ticket by id, calls OpenAI with `response_format: json_object`, parses `{ "category", "priority" }`, validates priority against an enum, updates the ticket, and on repeated failure applies defaults (`General`, `medium`) and marks triage failed. Show how to register the queue with retry/backoff defaults.

**Outcome:** `OpenaiTriageService` + `TriageProcessor` with bounded retries and fallback state on the ticket document.

### 3. End-to-end API tests

> Write Jest e2e tests for `POST /auth/register`, `POST /auth/login`, `POST /tickets` (no auth), `GET /tickets` and `PATCH /tickets/:id` with Bearer JWT. Mock the OpenAI triage service so tests do not call the network. Assume MongoDB and Redis are running locally.

**Outcome:** See [test/app.e2e-spec.ts](test/app.e2e-spec.ts) — tests override `OpenaiTriageService` with a deterministic classifier.

### 4. API contract alignment for registration and docs

> Update the auth flow so `POST /auth/register` also returns an access token (same envelope style as login), then align Swagger DTOs, unit tests, and module/root README files so the API docs reflect the exact runtime response shape.

**Outcome:** Registration now returns `data.access_token` with user summary fields (`id`, `email`, `role`), and related DTO/test/docs files were updated (`src/auth/dto/register.response.dto.ts`, `src/auth/auth.service.spec.ts`, `src/auth/auth.controller.spec.ts`, `README.md`, `src/auth/README.md`).

### 5. Backend bootstrap hardening and team workflow setup

> Set up the backend repo with Husky + lint-staged, ensure ESLint/Prettier are consistently applied on staged files, and add project-level Cursor rules + environment examples aligned with the current architecture.

**Outcome:** Added/verified `husky`, `lint-staged`, `prepare` script, `.husky/pre-commit`, `.husky/pre-push`, `.cursorrules`, and updated `.env.example` to include runtime keys for auth, triage, throttling, and observability.

### 6. Startup diagnostics and environment-gated Swagger

> Implement startup logging using `console.log` / `console.error` (not Nest `Logger` in `main.ts`), gate Swagger by environment (`local`/`development`/`dev`), and print deterministic startup URLs for API docs and queue monitoring.

**Outcome:** `main.ts` now logs startup URLs after successful `listen`, prints a Swagger URL only when `shouldExposeSwaggerDocs()` allows it, and exits with code `1` on bootstrap failure. `AppModule.onApplicationBootstrap()` logs MongoDB connection state/events, throttler configuration, and a one-off Redis `PING` result.

### 7. API prefix normalization (`api/v2` -> `api/v1`)

> Standardize all active routes, tests, and docs from `api/v2` to `api/v1` to match the desired public API contract.

**Outcome:** Prefix references were normalized across runtime code and docs, including `src/main.ts`, `test/app.e2e-spec.ts`, `.cursorrules`, and `STARTUP_LOGGING.md`. Current docs endpoint is `/api/v1/docs`; queue monitoring endpoint is `/api/v1/admin/triage-bullmq/stats`.

### 8. Coverage closure for ticket creation + AI parsing (Codematic 80% bar)

> Audit existing Jest coverage on the two paths Codematic calls out — ticket creation and AI parsing — and add the minimum tests needed to clear the 80% bar without adding fluff.

**Outcome:** Extended `tickets.service.spec.ts` with queue-enqueue-failure, full backoff-options shape, combined status+priority+search filters, regex-metacharacter escaping, default pagination, and totalPages rounding. Extended `openai-triage.service.spec.ts` with malformed JSON, unknown-category fallback, missing/invalid priority fallback, mixed-case priority, whitespace category, empty/null content, and OpenAI client rejection. Extended `triage.processor.spec.ts` with `ticket.save()` rejection on both the success path and the exhausted-retries fallback path, undefined `attempts` default, and non-`Error` rejection. Final coverage: `tickets.service.ts` 97.22% / 87.5%, `openai-triage.service.ts` 100% / 94.44%, `triage.processor.ts` 100% / 87.5% — 54/54 tests passing.

### 9. docker-compose orchestration (one-command spin-up)

> Build a `docker-compose.yml` that brings up MongoDB, Redis, the NestJS API, and the Next.js frontend with `docker compose up`. Production-style multi-stage images, healthchecks, named volumes for data persistence.

**Outcome:** Added [docker-compose.yml](../docker-compose.yml), multi-stage `Dockerfile`s for backend and frontend, `.dockerignore`s, and a root `.env.docker.example`. Mongo and Redis use named volumes (`mongo-data`, `redis-data` with AOF on Redis) so in-flight BullMQ jobs and ticket data survive restarts. Backend exposes 3001:3000 to free up host port 3000 for Next. Healthchecks on Mongo + Redis gate the backend's `depends_on`. The load-bearing detail: `NEXT_PUBLIC_API_BASE_URL` is baked into the browser bundle at build time so it must be a host-reachable URL (`http://localhost:3001`), while the Next *server* reaches the backend over the docker network at `http://backend:3000` via a separate `API_BASE_URL` env var that [`app/api/register-proxy/route.ts`](../frontend/app/api/register-proxy/route.ts) prefers when set. The whole stack was later refactored to drop `env_file:` in favor of explicit `${VAR:-}` interpolation in `environment:`, so the compose file alone documents every env var each service consumes — no hidden dependencies on `backend/.env` or `frontend/.env.local`.

### 10. E2E test isolation (separate Mongo DB + separate Redis DB number)

> The e2e suite calls `userModel.deleteMany({})` and `ticketModel.deleteMany({})` in `beforeAll`, then writes new fixtures. With no isolation that wipes whatever DB `MONGODB_URI` points at — including a developer's MongoDB Atlas cluster. Add isolation with belt-and-suspenders guards.

**Outcome:** `beforeAll` in `test/app.e2e-spec.ts` now unconditionally overrides `MONGODB_URI` to `mongodb://127.0.0.1:27017/codematicticketsystem-e2e` (CI override via `MONGODB_URI_E2E`) and refuses to run if the resolved URI doesn't contain `e2e` or `test`. Same treatment for Redis: `REDIS_DB=15` (CI override via `REDIS_DB_E2E`), refuses db `0`. `AppModule` was extended to wire `REDIS_DB` through to BullMQ's connection. Verified: prod queue (Redis db 0) and the dev `codematicticketsystem` Mongo database stay untouched after a full `npm run test:e2e` run.

## AI failure encountered

**Symptom:** An early suggestion used a non-existent or outdated NestJS JWT `expiresIn` typing, producing a TypeScript error where `string` was not assignable to the library’s `expiresIn` type.

**How we caught it:** `npm run build` failed with a clear `TS2322` on `JwtModule.registerAsync` options.

**Fix:** Centralized expiry handling in a small helper (`src/auth/jwt-expiry.ts`) that parses values like `1d` or `7d` into **seconds** (a `number`), which `jsonwebtoken` accepts reliably, and kept `JWT_EXPIRES_IN` in `.env` human-readable.

## Additional issue resolved during refinement

**Symptom:** After renaming admin queue monitoring from email to triage, the app failed at startup with `UnknownDependenciesException` for `BullQueue_triage`.

**How we caught it:** Runtime logs showed `TriageBullMqController` could not resolve the `BullQueue_triage` provider.

**Fix:** Updated `AppModule` queue registration from `BullModule.registerQueue({ name: 'email' })` to `BullModule.registerQueue({ name: 'triage' })`, then renamed the controller/spec filenames and imports to keep naming consistent (`triage-bullmq.controller.ts` and `.spec.ts`).

## Additional issue resolved during setup alignment

**Symptom:** API prefix values drifted during iterative setup, leaving mixed references to `api/v1` and `api/v2` across code/docs.

**How we caught it:** Workspace-wide search and validation passes surfaced inconsistent route strings.

**Fix:** Updated all active references to `api/v1` and re-verified with build/tests.

## AI failure encountered (e2e DB isolation)

**Symptom:** First pass at e2e isolation guarded the `MONGODB_URI` override with the same `??` fallback the existing secrets used (`process.env.MONGODB_URI ?? '…/codematicticketsystem-e2e'`). The reasoning was "let CI override by exporting MONGODB_URI." It seemed safe — but after the change shipped, e2e tests still wrote to the developer's MongoDB Atlas cluster and wiped its `tickets` and `users` collections.

**How we caught it:** Smoke-checking the local docker mongo after a successful test run — the e2e database was empty even though the suite asserted on writes. Adding a debug print to `beforeAll` revealed `process.env.MONGODB_URI` was *already* the Atlas URI by the time the hook ran. Some import side-effect (NestJS `ConfigModule` or jest preset) had loaded `backend/.env` before the hook fired, so the `??` fallback never kicked in.

**Fix:** Replaced the `??` fallback with an unconditional override (`process.env.MONGODB_URI = process.env.MONGODB_URI_E2E ?? '…/-e2e'`) and added a hard guard that refuses to run if the resolved URI doesn't contain `e2e` or `test`. The "CI override" path is now an explicit, separately-named env var (`MONGODB_URI_E2E`) so a regular `MONGODB_URI` in `.env` can never accidentally win. Same pattern applied to Redis.

**Lesson:** When isolation is the goal, "set it if not set" is the wrong primitive. You need "*always* set it; provide a separate, intentionally-named override for CI." The `??` reads as defensive but is actually a permissive default — it preserves whatever was there, including the thing you're trying to avoid.

---

_Smart Triage — Codematic submission._
