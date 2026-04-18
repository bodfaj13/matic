---
name: backend-implementation
description: Implements and reviews NestJS backend features using project conventions for DTO validation, tenant-scoped queries, queue safety, API consistency, and operational guardrails. Use when adding or updating backend modules, controllers, services, schemas, or queue processors.
---

# Backend Implementation

## Purpose

Use this workflow when creating or modifying backend features in this repository.

## Implementation Workflow

1. Identify the target feature module and keep changes colocated (`module`, `controller`, `service`, `dto`, `schemas`).
2. Ensure each important module has a local `README.md` that explains behavior and key usage/operational details.
3. Add or update DTOs with input validation and Swagger decorators for exposed request/response models.
4. Apply auth and permission guards where routes require authenticated access.
5. Ensure service queries are tenant/user scoped and ownership checks are enforced before mutations.
6. Keep response shapes consistent with project response wrappers.
7. For queue-backed changes, define typed payloads, explicit job names, retry strategy, and idempotent processing.
8. Add or adjust indexes for new query-heavy schema fields.
9. Document new environment variables in `.env.example`.
10. Update the module `README.md` whenever module behavior or contracts change.

## Validation Checklist

- [ ] DTOs are validated and documented.
- [ ] Sensitive data is not logged.
- [ ] Pagination output includes required metadata when applicable.
- [ ] Exceptions use Nest `HttpException` subclasses.
- [ ] New or changed flows have tests (or test impact is clearly noted).
- [ ] Formatting/linting standards are respected.
- [ ] Module `README.md` exists for important modules and is updated for relevant changes.

## Guardrails

- Do not scatter feature flag env reads; centralize through configuration access.
- Avoid introducing `console.log` in production paths.
- Preserve startup/runtime wiring expectations around Swagger, Sentry, throttling, and middleware.
