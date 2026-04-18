# Auth Module

This module handles user onboarding and authentication for support staff.

## Responsibilities

- Register `agent` and `admin` users.
- Validate registration secrets from header `x-registration-secret`.
- Authenticate users with email/password.
- Issue JWT access tokens.
- Expose auth endpoints and Swagger docs.

## Key files

- `auth.module.ts`: wires Mongoose user model, Passport, and JWT.
- `auth.controller.ts`: `POST /auth/register`, `POST /auth/login`.
- `auth.service.ts`: registration/login business logic.
- `jwt.strategy.ts`: validates bearer tokens.
- `jwt-auth.guard.ts`: protects authenticated routes.
- `dto/`: request/response DTOs for auth API contracts.

## Endpoint behavior

- `POST /auth/register` requires `x-registration-secret` header and returns:
  - `data.access_token`
  - created user summary: `id`, `email`, `role`
- `POST /auth/login` returns:
  - `data.access_token`
  - user summary: `email`, `role`

## Data model dependency

- Uses `users/schemas/user.schema.ts` with fields:
  - `email`
  - `passwordHash`
  - `role` (`agent` | `admin`)
