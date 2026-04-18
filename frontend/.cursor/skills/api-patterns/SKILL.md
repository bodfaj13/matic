---
name: api-patterns
description: >-
  Defines how to add and change API modules and TanStack Query hooks under
  frontend/lib/api. Use when creating API domains, axios call sites,
  request/response types, useQuery/useMutation hooks, or refactoring the API layer.
---

# API & React Query (`lib/api`)

## Before writing code

1. Follow the workspace rule **api-patterns** at `frontend/.cursor/rules/api-patterns.mdc`.
2. For form submit errors, follow **api-field-errors** (`getFieldErrorsFromApiResponse`).

## While implementing

- Use the shared HTTP client from `lib/api/axios.ts` (once present); do not add per-domain axios instances.
- Use `BaseResponse<T>`, `PaginatedRequest`, and `PaginatedResponse<T>` from `lib/api/types.ts` when they match backend contracts.
- Keep raw HTTP in each domain `index.ts`; keep React Query only in `use-<domain>.ts`.

## Layout reminder

Target paths are under **`frontend/lib/api/`** (not `src/api`), consistent with the Next.js app layout in this repo.
