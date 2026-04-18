---
name: smart-triage-frontend-features
description: Implements Smart Triage UI in the Next.js App Router—route layout, feature folders, domain split, and API/service layering. Use when building triage queue, case detail, intake, escalation, classification, or analytics screens in frontend.
---

# Smart Triage frontend features

## When to use

- New routes or pages under `frontend/app/` for triage workflows
- New or refactored modules under `features/*`, `components/triage/*`, `services/*`, `types/*`

## Architecture

1. **Routes** stay in `app/` using route groups as needed, e.g. `(dashboard)/triage`, `(dashboard)/triage/[caseId]`.
2. **Domain logic** lives in `features/<domain>/` (hooks, components, local types)—not only inside `page.tsx`.
3. **Shared triage UI** in `components/triage/`.
4. **HTTP and server state** in `services/` and/or colocated hooks; shared types in `types/` or `lib/`.

## Domain map

- **intake**: forms, validation, uploads, initial payload
- **triage-queue**: list, filters, sort, assign, bulk actions
- **case-detail**: timeline, notes, evidence, decisions
- **classification**: tags, severity, category, risk
- **escalation**: SLA signals, handoff, breach UX
- **analytics**: dashboards, trends, SLA views

## Implementation order (vertical slice)

1. Triage queue route + minimal list/empty states
2. Case detail route + read-only case shell
3. Typed API client + shared case/triage types—then expand UI and dependencies

## Guardrails

- Prefer Server Components by default; add `"use client"` only for interactivity or client-only data fetching patterns you adopt.
- Do not route with `react-router`; use `next/link`, `useRouter`, and App Router file conventions.
- Validate browser-only libraries before importing into Server Components.

## Reference

- `frontend/.cursor/rules/frontend-smart-triage-architecture.mdc`
- `frontend/.cursor/rules/frontend-next-stack.mdc`
