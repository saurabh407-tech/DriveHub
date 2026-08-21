# Testing

### Backend (Jest + Supertest)

```bash
cd backend
npm run test:unit         # pure business logic — pricing, refund policy, tokens, JWT, ApiError. No network needed.
npm run test:integration  # supertest against the real Express app — auth flow, RBAC. Needs mongodb-memory-server.
npm test                  # both
npm run test:coverage     # with a coverage report
```

`test:unit` covers logic that was deliberately extracted into pure,
side-effect-free functions specifically so it's easy to test without a
database — `src/utils/pricing.ts` (day-rate math, discounts, GST,
coupons) and `src/utils/refundPolicy.ts` (the 24-hour cancellation rule)
are the two most important examples; `booking.service.ts` now calls into
them rather than duplicating the math inline.

`test:integration` spins up a real in-memory MongoDB via
`mongodb-memory-server` and drives the actual Express app with
`supertest` — registration, duplicate-email rejection, login,
wrong-password rejection, and RBAC enforcement on an admin-only route.
**First run downloads a MongoDB binary and needs internet access**;
after that it's cached locally and runs offline. (This project was built
in a sandboxed environment without access to `fastdl.mongodb.org`, so the
integration suite is written and typechecked but wasn't execution-verified
there — the unit suite was. It should run immediately on any normal
machine or CI runner.)

### Frontend (Vitest + React Testing Library)

```bash
cd frontend
npm test          # runs once
npm run test:watch
npm run test:ui   # interactive UI
```

Covers the design-system primitives (`Button`, `Input`), the auth Redux
slice (login/logout/error handling, with the API layer mocked — no
network calls), and small pure utilities (booking status labels, role
redirect logic). Test files are excluded from the production `tsc -b`
build via `tsconfig.app.json`'s `exclude`, with their own
`tsconfig.vitest.json` for editor/type support.

### What's not covered yet

This is an honest gap list, not a hidden one: no end-to-end tests (e.g.
Playwright) exercising the full register → book → pay → chat flow in a
real browser, no tests for the Socket.io event handlers, and frontend
page-level components (forms with routing + Redux + API all wired
together) aren't tested — only the primitives and slice logic are. If
you want deeper coverage next, those three are the highest-value places
to extend.
