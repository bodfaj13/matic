---
name: frontend-setup
description: Runs and maintains the Smart Triage Next.js frontend locally—install, dev server, lint/build, and phased optional tooling. Use when setting up frontend, fixing local dev, CI scripts, or adding Prettier/hooks/tests without breaking the app.
---

# Frontend setup (Next.js)

## When to use

- First-time or refreshed checkout under `frontend/`
- Adding formatting, git hooks, or tests safely
- Verifying the app still builds after dependency changes

## Current baseline

- Next.js App Router (`app/`), not Vite.
- Commands: `npm install`, `npm run dev`, `npm run lint`, `npm run build`, `npm run start` (after build).
- In place: ESLint + `eslint-config-next`, TypeScript, Tailwind v4.
- Not assumed present: Husky, lint-staged, Prettier, Jest/Vitest (add only if `package.json` includes them).

## Workflow

1. From repo root: `cd frontend` then `npm install`.
2. Run `npm run dev` for local development.
3. Before PR/merge: `npm run lint`; run `npm run build` for production safety.

## Optional upgrades (phased, non-breaking)

**Phase 1 — Formatting:** add Prettier; scripts `format` / `format:check`. Do not change Next scripts.

**Phase 2 — Hooks:** add `husky` + `lint-staged` + `prepare`; start pre-push with `npm run lint`, add `npm run build` when stable.

**Phase 3 — Tests:** prefer Jest + RTL for Next defaults, or Vitest with explicit Next-compatible config; do not gate `pre-push` on tests until stable.

## Guardrails

- Never swap `next dev/build/start` for Vite.
- Do not add `react-router`.
- Keep `NEXT_PUBLIC_*` for client-visible env only.

## Reference

- Agent rules: `frontend/.cursor/rules/*.mdc`
- Agent skills: `frontend/.cursor/skills/*/SKILL.md`
- Next.js agent note: `frontend/AGENTS.md`
