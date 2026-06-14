# Node.js and Express.js Engineering Skills

This repo-local suite gives Codex three complementary senior engineering workflows.

## Skills

- `node-express-solid-engineer`: Implement and refactor Express/TypeScript code with pragmatic SOLID boundaries, production error handling, and maintainability review.
- `node-express-business-flow`: Trace a feature end to end, define business invariants and state transitions, and implement persistence and side effects safely.
- `node-express-quality-automation`: Reproduce bugs, identify root causes, add regression tests, and run syntax, type, lint, and test gates.

## Suggested Usage

Invoke one focused skill or combine them for larger work:

```text
Use $node-express-business-flow to map the order-cancellation process and identify its invariants.
Use $node-express-solid-engineer to refactor this controller and service without changing behavior.
Use $node-express-quality-automation to find the bug, add a regression test, and run all quality gates.
```

For a complete feature, use them in this order:

1. Understand the process with `node-express-business-flow`.
2. Design and implement with `node-express-solid-engineer`.
3. Verify and regression-test with `node-express-quality-automation`.

## Quality Gate Script

Run the reusable discovery script from the repository root:

```bash
bash skills/node-express-quality-automation/scripts/run-quality-gates.sh .
```

It uses the detected lockfile, runs available type-check, lint, and test scripts, and falls back to local TypeScript and ESLint binaries when those scripts are absent.

