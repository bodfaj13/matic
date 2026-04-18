# Users Module Area

This folder holds user persistence artifacts used by the Auth module.

## Responsibilities
- Define the user database schema for authentication and authorization.

## Current contents
- `schemas/user.schema.ts`
  - `email` (unique, lowercase)
  - `passwordHash`
  - `role` (`agent` | `admin`)
  - timestamps (`createdAt`, `updatedAt`)

## Usage
- Imported by `auth/auth.module.ts` via `MongooseModule.forFeature(...)`.
- Queried by `auth/auth.service.ts` for register/login flows.
