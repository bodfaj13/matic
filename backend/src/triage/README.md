# Triage Module

This module performs AI-based ticket classification asynchronously.

## Responsibilities
- Call OpenAI to classify ticket category and priority.
- Validate and normalize model output against enums.
- Update ticket records with triage results.
- Apply fallback values when retries are exhausted.

## Key files
- `openai-triage.service.ts`: calls OpenAI and parses JSON response.
- `triage.processor.ts`: BullMQ worker (`@Processor('triage')`) that processes triage jobs.

## Classification contract
- Category enum: `Billing`, `Technical Bug`, `Feature Request`, `General`, `Account`, `Security`.
- Priority enum: `high`, `medium`, `low`.

## Failure behavior
- Retries are configured on queue jobs (exponential backoff).
- On final failure:
  - category -> `General`
  - priority -> `medium`
  - triageStatus -> `failed`
  - triageError -> error message
