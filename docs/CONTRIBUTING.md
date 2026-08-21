# Contributing

## Local setup

See the root [`README.md`](../README.md#getting-started) for backend +
frontend setup. Once running, `backend/npm run test:unit` and
`frontend/npm test` should both pass before you start changing anything
— that's your baseline.

## Code conventions

- **TypeScript everywhere**, strict mode on both apps. Don't add `any`
  where a real type is knowable; if you're stuck, prefer a narrow local
  `as` cast with a comment over a broad `any`.
- **Controllers stay thin.** A controller parses `req`, calls exactly one
  service function, and shapes the response. Business logic — anything
  with an `if`, a calculation, or a database query beyond a single
  `findById` — belongs in a `service`, not a controller. See
  [Architecture → Folder structure](./ARCHITECTURE.md#folder-structure).
- **Pure logic goes in `utils/`, not inline in a service.** If you're
  writing a calculation (pricing, a policy, a formatter) that doesn't
  need `await` or a database, extract it as a pure function first — see
  `utils/pricing.ts` and `utils/refundPolicy.ts` for the pattern. Pure
  functions are trivial to unit test; logic tangled into an async service
  method usually isn't.
- **Every new external integration follows the fallback pattern.** If you
  add a service that needs an API key, check whether the key is
  configured at module load, log a warning if not, and provide a
  same-shape substitute rather than throwing. See
  [Architecture](./ARCHITECTURE.md#the-graceful-fallback-pattern) for the
  four existing examples.
- **Validate at the route, authorize at the route.** `express-validator`
  chains live in `validators/`, one file per resource, wired in the
  route file — not scattered as manual `if` checks inside controllers.
  Every protected route explicitly lists `authenticate` and, if
  role-gated, `authorize(...)` — don't rely on a global middleware to
  imply auth.
- **Never trust client-provided prices, totals, or ownership.** Pricing
  is always recomputed server-side from the vehicle's stored rate; a
  resource's owner is always checked against `req.user.id`, never a
  client-supplied field.
- **Frontend**: Redux is for auth state only — don't add new slices for
  page-local data; use `useState`/`useEffect` with the relevant
  `services/*Api.ts` function, matching the existing pages. If a
  cross-cutting data-fetching need becomes painful under this pattern,
  that's a signal to introduce React Query deliberately, not to
  special-case one more slice.

## Adding a new resource (the established shape)

Every resource so far (auth, users, vehicles, bookings, payments, chat,
notifications, analytics) follows the same five files:

```
models/Thing.model.ts            Mongoose schema + IThing interface
validators/thing.validator.ts    express-validator chains
services/thing.service.ts        business logic, the only layer touching the model
controllers/thing.controller.ts  thin req/res wrappers around the service
routes/thing.routes.ts           wires authenticate/authorize/validate/controller together
```

Then register the router in `app.ts` under `/api/v1/thing`, and add the
route table to [`API.md`](./API.md) and the schema table to
[`DATABASE.md`](./DATABASE.md) — both were written directly from the
route/model files, so keeping them in sync is a matter of mirroring
what you added, not writing prose from scratch.

On the frontend, mirror it with `services/thingApi.ts` (typed request
functions) and `pages/.../ThingPage.tsx` using the existing
`DashboardLayout`, `Button`, `Input`, `Card`/`Badge`/`StatCard`,
`EmptyState` primitives from `components/ui/` rather than one-off markup.

## Before opening a PR (or asking for the next phase)

1. `cd backend && npx tsc -p tsconfig.json --noEmit && npm run build`
2. `cd backend && npm run test:unit` (and `test:integration` if you have
   network access for the MongoDB binary)
3. `cd frontend && npx tsc -b --noEmit && npm run build`
4. `cd frontend && npm test`

All four passed for every phase in this project's history — treat a
red result as something to fix before moving on, not something to note
and continue past.

## Commit / phase conventions

This project was built phase-by-phase (see the [Roadmap](../README.md#roadmap)
in the root README), each phase a coherent, working slice rather than a
partial one. If you're extending it the same way: pick one module's
worth of work, take it through the five-file shape above end to end
(model → validator → service → controller → route → frontend page),
verify with the four commands above, and update `API.md`/`DATABASE.md`/
`CHANGELOG.md` in the same change — not as a follow-up.
