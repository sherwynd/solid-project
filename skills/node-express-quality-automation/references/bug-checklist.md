# Node and Express Bug Checklist

## Runtime and Async

- Missing `await`, floating promises, double callbacks, and async errors outside Express error handling.
- Response sent twice or execution continuing after `res.send`, `res.json`, or `next(error)`.
- Unhandled rejections, open timers, sockets, Redis clients, database pools, or workers.
- ESM/CommonJS mismatch, missing file extensions, incorrect default imports, or runtime-only path errors.

## Input and Contract

- Unvalidated body, params, query, headers, environment, database rows, or vendor payloads.
- String-to-number coercion, `NaN`, unsafe integers, rounding, locale, date, or time-zone errors.
- Incorrect status code, response shape, content type, or error disclosure.

## State and Business Rules

- Invalid transitions, missing authorization, race conditions, lost updates, or partial writes.
- Duplicate webhook, command, job, or payment processing without idempotency.
- Side effects emitted before durable commit or retries that repeat non-idempotent work.
- Cache invalidation, stale reads, or cache and database disagreement.

## Security and Operations

- Injection, path traversal, SSRF, prototype pollution, mass assignment, secret logging, or permissive CORS.
- Missing timeout, retry limit, backoff, cancellation, rate limit, or payload-size protection.
- Logs without correlation context or metrics that hide failure outcomes.

