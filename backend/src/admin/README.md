# Admin Module Area

Admin endpoints expose operational/diagnostic capabilities.

## Responsibilities

- Provide triage queue visibility for monitoring.

## Current endpoint

- `GET /admin/triage-bullmq/stats`
  - Returns BullMQ job counts for the `triage` queue:
    - `waiting`, `active`, `completed`, `failed`, `delayed`, `paused`

## Key files

- `triage-bullmq.controller.ts`: triage queue stats endpoint.
- `dto/queue-stats.response.dto.ts`: Swagger response schema for queue stats.

## Notes

- This endpoint is useful for runtime health checks and debugging triage processing behavior.
