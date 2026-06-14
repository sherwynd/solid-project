---
name: node-express-business-flow
description: Discover, document, validate, and implement end-to-end business process flows in Node.js and Express.js applications. Use when a feature crosses routes, middleware, services, databases, queues, jobs, webhooks, or external APIs; when business rules are unclear; or when Codex must understand the whole workflow before changing behavior or adding tests.
---

# Node Express Business Flow

Build a verified model of the workflow before editing it.

## Trace the Flow

1. Locate every entry point: HTTP routes, consumers, scheduled jobs, CLI commands, webhooks, and internal calls.
2. Follow each entry through authentication, authorization, validation, orchestration, domain decisions, persistence, external integrations, emitted events, and final output.
3. Search by route, event, table/model, status value, error code, and called method. Do not stop at the first matching controller.
4. Read tests, schemas, migrations, fixtures, API contracts, and configuration that constrain behavior.
5. Record unknowns explicitly. Resolve them from code or user-provided requirements before inventing policy.

Use [references/flow-analysis.md](references/flow-analysis.md) for the flow model and review checklist.

## Model Business Logic

Define these before implementation:

- Actors and permissions.
- Trigger and preconditions.
- Inputs and trust boundaries.
- Business invariants that must always hold.
- State transitions, including invalid transitions.
- Calculations, rounding, time zones, limits, and ordering rules.
- Persistence changes and transaction boundaries.
- External side effects and their retry/idempotency behavior.
- Success output and each meaningful failure outcome.

Represent non-trivial lifecycle behavior as a transition table. Name the authoritative source for each rule.

## Implement Safely

- Keep business decisions in domain or application code that can run without Express.
- Make authorization and validation explicit at the correct boundary.
- Protect multi-write invariants with a transaction when the datastore supports it.
- Define whether external effects occur before or after commit; use an outbox or equivalent when delivery must survive process failure.
- Require an idempotency strategy for retried commands, webhooks, payments, provisioning, and queue consumers.
- Handle duplicate, stale, reordered, and partially completed inputs where plausible.
- Preserve backward compatibility unless the requirement explicitly changes the contract.

## Test the Flow

Cover the happy path, each business rejection, boundary values, invalid state transitions, authorization, duplicate execution, dependency failure, and rollback or recovery behavior. Prefer unit tests for decision tables and integration tests for wiring, persistence, and HTTP contracts.

Finish with a concise flow summary: entry point, key decisions, writes, side effects, response, and remaining assumptions.

