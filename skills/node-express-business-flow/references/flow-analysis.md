# Flow Analysis Template

## Flow Map

| Stage | Code owner | Input | Decision or transformation | Output or side effect |
| --- | --- | --- | --- | --- |
| Entry | Route, job, consumer, command | Raw trigger | Select workflow | Request context |
| Boundary | Middleware or schema | Untrusted data | Authenticate, authorize, validate | Typed command |
| Application | Use case or service | Command | Coordinate domain and dependencies | Result |
| Domain | Policy or entity | Valid state | Enforce invariant and transition | New state or rejection |
| Infrastructure | Repository or adapter | State and effects | Commit, publish, call vendor | Durable outcome |
| Delivery | Presenter or handler | Result or error | Map contract | HTTP/event output |

## Questions

- What starts the process and who may start it?
- What is the source of truth?
- Which rules are policy, and which are technical constraints?
- Which writes must succeed together?
- Can the operation be repeated safely?
- What happens after timeout when the caller does not know whether it succeeded?
- Can events arrive twice or out of order?
- Which timestamps and time zones govern the rule?
- What is logged, measured, or alerted?
- How is a partially completed operation repaired?

## Transition Table

| Current state | Command | Guard | Next state | Writes | Side effects | Failure |
| --- | --- | --- | --- | --- | --- | --- |

Reject transitions not listed unless requirements explicitly define a fallback.

