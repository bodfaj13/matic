# Common Module Area

`common/` contains reusable cross-cutting building blocks shared by features.

## Contents
- `decorators/`
  - `roles.decorator.ts`: `@Roles(...)` metadata helper.
- `dto/`
  - `error-response.dto.ts`: shared Swagger error response schema.
- `enums/`
  - Ticket/auth domain enums (`UserRole`, `TicketStatus`, `TicketPriority`, `TicketCategory`, `TriageStatus`).
- `guards/`
  - `roles.guard.ts`: role-based authorization guard.
  - `conditional-throttler.guard.ts`: enables/disables throttling from env.
- `interfaces/`
  - `BaseResponse<T>`
  - `PaginatedResponse<T>`

## Why this exists
- Keeps controllers/services focused on feature logic.
- Avoids duplication of security, typing, and response contract primitives.
