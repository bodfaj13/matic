# Smart Triage (Frontend)

**Smart Triage** frontend is the staff-facing Next.js app for triage workflows: it will consume the NestJS API under [backend/README.md](../backend/README.md), use the App Router (`app/`), and ship with TypeScript, Tailwind v4, ESLint, and [shadcn/ui](https://ui.shadcn.com/) (Tailwind v4 + **base-nova** preset, [Base UI](https://base-ui.com/) primitives).

## Prerequisites

- Node.js 20+
- npm
- (Optional, for full-stack local dev) MongoDB, Redis, and the backend API running — see [backend/README.md](../backend/README.md)

## Quick start

From this directory:

```bash
cp .env.example .env.local
# Adjust NEXT_PUBLIC_API_BASE_URL if your API port differs from the example
npm install
npm run dev
```

- App (dev): [http://localhost:3000](http://localhost:3000)
- Planned route layout and feature folders are described for agents in [.cursor/rules/frontend-smart-triage-architecture.mdc](.cursor/rules/frontend-smart-triage-architecture.mdc).

Environment variables are documented in [.env.example](.env.example).

### Consuming the API

- Set **`NEXT_PUBLIC_API_BASE_URL`** to your running API origin (no trailing slash), e.g. `http://localhost:3001` when Next uses port `3000` locally. The same variable is used by `app/api/register-proxy` to call the backend.
- Set **`AGENT_REGISTRATION_SECRET`** (server-only, never `NEXT_PUBLIC_*`) in `.env.local` when using agent self-registration; it must match the backend’s `AGENT_REGISTRATION_SECRET`, and you need **`NEXT_PUBLIC_SHOW_REGISTER=true`** to expose `/register`.
- Response envelopes and auth behavior match the backend; see **Response shape** and **Main routes** in [backend/README.md](../backend/README.md).
- When you add `lib/api`, use a single HTTP client and the patterns in [.cursor/rules/api-patterns.mdc](.cursor/rules/api-patterns.mdc).

## Scripts

```bash
npm install
npm run dev      # Next.js dev server
npm run build    # production build
npm run start    # production server (after build)
npm run lint     # ESLint
```

## Project layout (high level)

| Area                  | Purpose                                                                                                                     |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `app/`                | App Router: layouts, pages, `globals.css`                                                                                   |
| `app/utils/logger.ts` | Shared logging (`logInfo`, `logWarn`, `logError`, …) — see [.cursor/rules/logger-usage.mdc](.cursor/rules/logger-usage.mdc) |
| `components/ui/`      | shadcn-generated components ([components.json](components.json))                                                            |
| `lib/utils.ts`        | `cn()` helper for Tailwind class merging                                                                                    |
| `lib/`                | Shared libraries (e.g. future `lib/api/` client)                                                                            |

### shadcn/ui

- Config: [components.json](components.json) (aliases: `@/components`, `@/lib/utils`).
- Add components: `npx shadcn@latest add <name>` (e.g. `card`, `input`, `dialog`) from this directory.
- Init is already done; a sample **Button** lives at [components/ui/button.tsx](components/ui/button.tsx).

---

## Verification (Codematic)

### Auth and secrets in the browser

1. **Never put secrets in `NEXT_PUBLIC_*`** — only values safe for the bundle belong there (API base URL, public env flags).
2. **Access tokens** — store and attach JWTs in a pattern you standardize (httpOnly cookies vs memory); align with how the backend issues tokens (`POST /api/v1/auth/login`, etc.).
3. **Role-aware UI** — mirror backend roles (`agent`, `admin`) for hiding or disabling actions; the API remains the source of truth via guards.

### When the API or triage worker is slow or down

1. **Surface errors clearly** — use shared error mapping when `lib/api` exists ([.cursor/rules/api-field-errors.mdc](.cursor/rules/api-field-errors.mdc)).
2. **Do not block the whole app** — scope loading and failure states to the view or query that failed.
3. **Retries** — prefer explicit retry/backoff in the HTTP or React Query layer for idempotent reads, not for unsafe duplicate writes.

---

## Further reading

- [AI_JOURNEY.md](AI_JOURNEY.md) — AI-assisted development notes (Codematic).
- [AGENTS.md](AGENTS.md) — Next.js version note + where project `.cursor` rules and skills live.
