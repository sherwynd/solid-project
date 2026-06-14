---
name: node-express-quality-automation
description: Diagnose bugs and verify Node.js, Express.js, JavaScript, and TypeScript changes with syntax checks, strict type checking, linting, automated tests, coverage, and focused regression tests. Use for bug investigation, code review, failing builds, runtime errors, test creation, CI preparation, or any request to prove a Node/Express change is safe.
---

# Node Express Quality Automation

Treat verification as evidence, not ceremony. Reproduce first, fix the cause, and prove the relevant behavior.

## Investigate

1. Read package scripts, lockfiles, runtime version files, compiler/linter/test configuration, and repository instructions.
2. Start from the exact error, command, request, or failing test supplied by the user.
3. Reproduce with the narrowest deterministic command.
4. Trace inputs and state to the first incorrect assumption, not merely the final thrown error.
5. Check adjacent paths for the same defect pattern.
6. Add a regression test that fails for the original reason before or alongside the fix when practical.

Read [references/bug-checklist.md](references/bug-checklist.md) during reviews or ambiguous failures.

## Run Quality Gates

Run `scripts/run-quality-gates.sh [project-directory]` for a portable first pass. Inspect its detected commands before treating success as complete.

The minimum evidence is:

1. Parse or syntax validity.
2. Type checking for TypeScript projects.
3. Linting when configured.
4. Focused tests for the changed behavior.
5. Full automated tests when runtime and time permit.

Use repository-native scripts over guessed commands. Do not add dependencies or rewrite configuration merely to make a check available. If a script is absent, use an installed local binary only when its configuration is clear.

## Test Design

- Test observable behavior and business outcomes.
- Cover success, validation failure, authorization failure, dependency failure, and boundary values relevant to the change.
- Use unit tests for pure rules and integration tests for Express routing, middleware order, persistence, serialization, and error mapping.
- Mock only true boundaries such as clocks, random values, external services, queues, and expensive infrastructure.
- Prevent open handles by closing servers, clients, timers, workers, and database pools.
- Keep tests deterministic; avoid real network calls and wall-clock dependence.

## Report

State the root cause, user-visible symptom, fix, regression test, commands run, and any residual risk. Never report a check as passing if it was skipped, timed out, or failed for an unrelated environment issue.

