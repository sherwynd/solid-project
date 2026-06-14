# Node Express Architecture Guide

## Suggested Responsibilities

| Layer | Owns | Must not own |
| --- | --- | --- |
| Route and middleware | Routing, authentication context, transport concerns | Business decisions |
| Controller or handler | Input mapping and response mapping | Database queries and policy branching |
| Application service | Use-case orchestration and transaction intent | Express request or response objects |
| Domain policy or entity | Invariants, calculations, valid transitions | Vendor SDK and framework details |
| Repository or adapter | Persistence and external-system translation | HTTP response choices |

Use these as reasoning boundaries, not mandatory folders.

## Dependency Test

For each module, ask:

1. What business capability does it own?
2. What causes it to change?
3. Which dependencies are policy and which are implementation details?
4. Can its core behavior be tested without Express, network, clock, or database?
5. Does its interface expose only what its consumer needs?

## Abstraction Threshold

Introduce an interface, strategy, factory, or base abstraction only when at least one is true:

- Multiple real implementations exist or are immediately required.
- A volatile external dependency must be isolated.
- The business policy cannot be tested deterministically otherwise.
- Repeated branching represents the same stable concept.

Avoid speculative repositories, one-method classes with no boundary value, and interfaces that merely duplicate concrete classes.

