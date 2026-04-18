# Tickets Module

This module is the core ticketing API for Smart Triage.

## Responsibilities
- Accept public ticket submissions.
- Return paginated ticket lists for authenticated agents/admins.
- Update ticket status (`open`, `in_progress`, `resolved`).
- Enqueue triage jobs when tickets are created.
- Return standardized API envelopes (`BaseResponse`, `PaginatedResponse`).

## Key files
- `tickets.module.ts`: registers Ticket schema + Bull queue `triage`.
- `tickets.controller.ts`: CRUD-style ticket endpoints.
- `tickets.service.ts`: create/list/update business logic and queue enqueueing.
- `schemas/ticket.schema.ts`: Mongo schema, enums, indexes.
- `dto/`: request/response DTOs used by controller and Swagger.

## Endpoints
- `POST /tickets` (public)
- `GET /tickets` (JWT + roles `agent|admin`)
- `PATCH /tickets/:id` (JWT + roles `agent|admin`)

## Triage integration
- New tickets are saved with `triageStatus: pending`.
- A job is pushed to queue `triage` for async AI classification.
