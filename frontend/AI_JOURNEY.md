# AI_JOURNEY — Smart Triage (Frontend)

This document satisfies the Codematic **AI-first workflow**: representative prompts used during development, plus one example of an AI mistake and how it was corrected.

## Complex prompts used

### 1. Handoff doc aligned to Next.js App Router (not Vite)

> We have a `setup-and-modules-handoff.md` written for a Vite-based stack. Rewrite it for our **Smart Triage** product and a **Next.js** app so we do not document scripts or tooling that would break the app.

**Outcome:** The handoff described `next dev/build/start`, App Router under `app/`, Tailwind v4 + ESLint baseline, optional phased tooling (Prettier, Husky, tests), and Smart Triage route/feature boundaries. Vite-specific instructions were removed.

### 2. Translate handoff into Cursor skills and rules

> Turn `frontend/setup-and-modules-handoff.md` into **skills** and **rules** under `frontend/.cursor` so agents get persistent, scoped guidance.

**Outcome:** Added `frontend/.cursor/rules/frontend-next-stack.mdc`, `frontend-smart-triage-architecture.mdc`, and skills `frontend-setup`, `smart-triage-frontend-features` (`SKILL.md` files). The standalone handoff file was later removed once `.cursor` became the source of truth.

### 3. Consolidate workspace `.cursor` into the frontend app

> Pick what we can from repo-root `.cursor` into `frontend/.cursor`, then delete the root `.cursor`. Implement `app/utils/logger.ts` for Next, and add `frontend/.env.example`.

**Outcome:** Migrated logger/toast/API-pattern guidance into `frontend/.cursor/rules/` (`logger-usage.mdc`, `toast-usage.mdc`, `api-patterns.mdc`, `api-field-errors.mdc`) and `frontend/.cursor/skills/api-patterns/SKILL.md`, retargeted to `frontend/lib/api` and `@/app/utils/logger`. Root `.cursor` was removed. Added `frontend/.env.example` with `NEXT_PUBLIC_APP_ENV` and `NEXT_PUBLIC_API_BASE_URL`.

### 4. Shared logger for Next (env + production safety)

> Replace Vite-style logging with something that works in Next and matches team rules: verbose in dev/local/test, errors always, named exports (`logInfo`, `logWarn`, `logError`, grouped logs).

**Outcome:** `app/utils/logger.ts` uses `process.env.NODE_ENV` and `NEXT_PUBLIC_APP_ENV` (`local` / `test` for verbose). `logError` always emits. Rules document `@/app/utils/logger` and discourage raw `console.*` outside that module.

### 5. API layer conventions before `lib/api` exists

> Document how we will add axios + TanStack Query domains later, consistent with the backend’s `BaseResponse` / field-error shapes.

**Outcome:** Rules and skill describe `lib/api/<domain>/index.ts`, `types.ts`, `use-<domain>.ts`, shared client, and `getFieldErrorsFromApiResponse` for react-hook-form catch blocks (see `api-field-errors.mdc`).

### 6. Agent discoverability in the Next repo

> After moving rules under `frontend/.cursor`, make sure contributors (and agents) know where to look.

**Outcome:** `AGENTS.md` notes that project-specific rules and skills live under `frontend/.cursor/`.

### 7. Kanban drag-and-drop with optimistic updates

> For the dashboard kanban view we need to be able to move tickets by dragging them between columns and apply optimistic updates based on where they are dropped.

**Outcome:** Wrapped the columns grid in a `DndContext` (`@dnd-kit/core`, already a dep). Each column became a `useDroppable` keyed by its `TicketStatus`; each card became a `useDraggable` carrying the ticket in `data`. A `PointerSensor` with `activationConstraint: { distance: 6 }` keeps card-clicks (drawer open) distinct from drags, and a `KeyboardSensor` preserves accessibility (Space → arrows → Space). A `DragOverlay` shows a ghost preview while the source card dims. The legacy inline `→ status` buttons were removed in favour of pure DnD.

`useUpdateTicketMutation` in `lib/api/tickets/use-tickets.ts` was extended with the standard React Query optimistic triad: `onMutate` cancels in-flight `["tickets", …]` queries, snapshots every cache entry under that prefix, and patches the changed ticket in place; `onError` restores the snapshots and surfaces a `showError` toast; `onSettled` invalidates so the server reconciles. The drawer's `handleStatusChange` was reordered to update local `selected` state _before_ awaiting the mutation, so it stays in sync with the optimistic cache.

### 8. Test scaffolding from zero (Codematic 80% coverage bar)

> The frontend has no test runner, no test deps, no spec files. Stand up Jest + React Testing Library (matching `.cursor/skills/frontend-setup` guidance) and write business-logic tests for the modules that matter — the optimistic-update mutation, API field-error parsing, the session store, the auth flow, the env-conditional logger — without falling into rendering-test sprawl for the kanban DnD UI.

**Outcome:** Added `jest`, `@testing-library/react`, `@testing-library/jest-dom`, `jest-environment-jsdom`, `@swc/jest` (faster TypeScript transform than ts-jest, no Next config needed), and the `test` / `test:cov` scripts. `jest.config.ts` scopes `collectCoverageFrom` to `lib/**` + `app/utils/**` so UI rendering and route files don't dilute the percentage. 15 spec files, **91 tests, all passing, 97.88% statements / 92.07% branches**. Heaviest spec is `lib/api/tickets/use-tickets.spec.ts` which uses `renderHook` + a fresh `QueryClient` per test to prove the optimistic-update triad: assert the cache is patched _before_ the mutation promise resolves, then assert it's restored to the snapshot when the request rejects, then assert `showError` is called via a mocked `@/app/utils/toast-helpers`. Component render tests for `TicketsKanban` itself were intentionally skipped — would have needed a dnd-kit pointer-event shim for very little marginal coverage gain over the hook + pure-function tests.

## AI failure encountered (kanban DnD)

**Symptom:** The first plan for the kanban DnD work proposed keeping the existing inline `→ Open / → In progress / → Resolved` buttons "as a fallback" alongside the new drag-and-drop, citing accessibility. The actual brief was simply to make cards draggable — `@dnd-kit/core`'s `KeyboardSensor` already covers keyboard users, so the buttons would have been visual noise duplicating a capability we were adding.

**How we caught it:** A clarifying question to the user (`AskUserQuestion`) before exiting plan mode — they explicitly chose "Remove them," which exposed my additive-over-destructive default.

**Fix:** Updated the plan to delete the buttons outright, dropped the now-unused `isUpdating` prop on `<TicketsKanban>` at the call site in `app/(dashboard)/triage/page.tsx`, and relied on dnd-kit's built-in `KeyboardSensor` (Space → arrows → Space) for keyboard accessibility, with `aria-roledescription="draggable ticket"` on cards and an `aria-label` on each column for screen-reader clarity.

**Lesson:** When a brief asks to _change_ an interaction, default to replacement, not coexistence. Keeping legacy controls "just in case" was hedging, not helpfulness — and it would have left the cards visually busier than the new affordance warranted.

## Additional issue resolved during env compaction

**Symptom:** [`frontend/.env.example`](.env.example) declared `NEXT_PUBLIC_AGENT_REGISTRATION_SECRET=` while its own surrounding comment warned **"Do not use `NEXT_PUBLIC_` — Next inlines those into the client bundle and would leak this value."** The actual code in [`app/api/register-proxy/route.ts`](app/api/register-proxy/route.ts) reads `process.env.AGENT_REGISTRATION_SECRET` (no prefix). A reviewer copying the example into `.env.local` and filling it in would have wired it up to nothing — the proxy would respond `503 "Agent registration is not configured"`.

**How we caught it:** Compacting the `.env.example` files prompted a re-read of every var name against where it's actually consumed. The contradictory comment-vs-key was obvious on a fresh read.

**Fix:** Renamed the example var to `AGENT_REGISTRATION_SECRET=` (no prefix), matching the code. Added the new server-only `API_BASE_URL` (introduced for Docker networking) as a commented-out line so future readers understand the browser-vs-server URL split without grepping.

---

_Smart Triage — Codematic submission (frontend)._
