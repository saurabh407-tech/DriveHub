# Architecture

## Stack

| Layer | Choice |
|---|---|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS v4, Redux Toolkit, React Router, React Hook Form + Zod, Recharts |
| Backend | Node.js, Express, TypeScript, Mongoose |
| Database | MongoDB |
| Real-time | Socket.io (chat, live tracking, notifications) |
| Auth | JWT (access + refresh), httpOnly refresh cookie, bcrypt |
| File storage | Cloudinary, with an automatic local-disk fallback |
| Payments | Razorpay, with an automatic mock-mode fallback |
| Maps | Google Maps JS API (Places Autocomplete + Maps), with an automatic plain-text-address fallback |
| Email | Nodemailer, with an automatic console-log fallback |
| PDF | PDFKit (invoices) |

## The "graceful fallback" pattern

Five different external services (Cloudinary, Razorpay, Google Maps,
SMTP, and — implicitly — a payment gateway's webhook infrastructure) are
all wired the same way: **if the required credentials aren't present in
`.env`, the feature still works, just via a simpler local substitute**,
and a warning is logged once at startup so it's obvious which mode
you're in.

| Service | With credentials | Without credentials |
|---|---|---|
| Cloudinary (`backend/src/services/upload.service.ts`) | Uploads to Cloudinary | Writes to `backend/uploads/`, served via `express.static` |
| Razorpay (`backend/src/services/payment.service.ts`) | Real order creation, signature verification, refunds | Mock orders (`order_mock_...`), verification auto-succeeds, mock refunds |
| Google Maps (`frontend/src/utils/loadGoogleMaps.ts`) | Places Autocomplete + draggable-pin map | Plain text address `<input>` |
| SMTP (`backend/src/services/email.service.ts`) | Sends real email | Logs the email body to the console (`[DEV EMAIL]`) |

This means the entire project — register → verify → book → pay → chat →
track → get notified — is runnable and demoable with **zero external
accounts**, while still being real, production-shaped integration code
that only needs environment variables added to go live.

## Folder structure

```
backend/src/
  config/       env.ts, db.ts
  controllers/  HTTP layer — parses req, calls a service, shapes the response
  services/     business logic — the only layer that talks to models directly
  models/       Mongoose schemas
  routes/       wires validators + middleware + controllers together
  middlewares/  authenticate, authorize, validate, rateLimiter, upload, errorHandler
  validators/   express-validator chains, one file per resource
  utils/        pure functions (pricing, refundPolicy, jwt, tokens, ApiError, logger)
  socket/       Socket.io server + auth + event handlers
  interfaces/   ambient type declarations (Express.Request augmentation)

frontend/src/
  components/   ui/ (design-system primitives), layout/, vehicles/, bookings/, chat/, maps/, charts/
  pages/        one folder per role/section (auth, customer, owner, admin, vehicles, bookings, messages)
  redux/        store + slices
  services/     one file per API resource, plus api.ts (axios) and socket.ts
  routes/       ProtectedRoute, RoleRoute, role→dashboard redirect helper
  hooks/        typed Redux hooks
  utils/        small pure helpers (booking status labels, script loaders)
```

Controllers never touch Mongoose models directly, and services never
touch `req`/`res` — this is the one architectural rule that's held
consistently across all sixteen phases, which is what makes the
services layer straightforward to unit test in isolation (see
[Testing](./TESTING.md)).

## Auth flow

1. `POST /auth/register` creates a `User` with `isEmailVerified: false`,
   generates a 6-digit OTP, stores its **hash** (never the raw value),
   and emails it (or logs it, in the fallback case).
2. `POST /auth/verify-otp` compares the submitted OTP against the hash.
3. `POST /auth/login` returns a short-lived **access token** in the
   response body and sets a long-lived **refresh token** as an httpOnly
   cookie (scoped to `/api/v1/auth`, so it's never sent to routes that
   don't need it).
4. The frontend keeps the access token in memory only (`services/api.ts`)
   — never `localStorage` — and attaches it via an axios request
   interceptor.
5. On a `401`, a response interceptor calls `/auth/refresh-token` (which
   reads the cookie), retries the original request once with the new
   token, and coalesces concurrent 401s into a single refresh call so a
   page with five simultaneous requests doesn't trigger five refreshes.
6. The refresh token itself is stored server-side as a **hash** on the
   user document and rotated on every use; if a presented refresh token
   doesn't match the stored hash, the session is defensively revoked
   (possible token theft/reuse).

## RBAC

Two middlewares, always used together: `authenticate` (verifies the JWT,
loads the user, checks `isActive`/`isBanned`, attaches `req.user`) and
`authorize('owner', 'admin', ...)` (checks `req.user.role` against an
allow-list). Route-level, not model-level — every route file makes its
authorization requirements visible by reading the route table, which is
also why [`API.md`](./API.md) could be written directly from the route
files rather than from memory.

### A single User collection for all three roles

Rather than separate `Customer`/`Owner`/`Admin` collections, all three
are one `User` document distinguished by a `role` field. The alternative
(separate collections, or a discriminator pattern) buys type-narrowing at
the cost of duplicating every shared field (auth, verification, wallet)
three times and complicating the JWT payload (`role` would need to encode
*which collection* to query). For a platform where the same person could
plausibly want to be both a customer and an owner, and where role changes
by an admin should be a one-field update rather than a document migration,
a single collection was the simpler, more honest model of the domain.

## Booking → Payment → Trip lifecycle

```
create booking            pay (mock or Razorpay)      trip
──────────────────►  pending_payment  ──────────►  confirmed  ──start──►  ongoing  ──complete──►  completed
      │                                                  │                    │
      │ (any point before "ongoing")                     │                    │
      └──────────────────────► cancelled_by_customer / cancelled_by_owner ◄───┘
                                (refund per policy, calendar hold released)
```

- **Creating** a booking computes pricing server-side
  (`utils/pricing.ts`), checks the vehicle's `blockedDates` for overlap,
  and immediately adds a hold to `blockedDates` — this reserves the slot
  during checkout even before payment completes. There's no expiry timer
  on an unpaid hold yet (see [Known Gaps](./DATABASE.md#known-gaps-honest-not-hidden)).
- **Paying** (`payment.service.ts`) verifies the Razorpay signature (or
  accepts a mock order unconditionally), marks the `Payment` `captured`,
  flips the `Booking` to `confirmed`, generates an invoice PDF, and
  notifies both parties.
- **Cancelling** (`booking.service.ts`) computes a refund via
  `utils/refundPolicy.ts` (full refund ≥24h out, 50% within 24h, none
  once `ongoing`), releases the calendar hold, and — if a payment was
  captured — calls `payment.service.ts`'s refund function via a **lazy
  `import()`** specifically to avoid a circular module dependency
  (`payment.service.ts` imports `booking.service.ts` for
  `confirmBookingPayment`; `booking.service.ts` cannot import
  `payment.service.ts` at the top level without creating a cycle).

## Real-time layer

One Socket.io server (`backend/src/socket/index.ts`), attached to the
same HTTP server as Express (`server.ts` uses `http.createServer(app)`
rather than `app.listen()` specifically to share the port). Every socket
connection is authenticated with the same JWT used for REST — no
separate auth mechanism to keep in sync — and joins a personal room
(`user:<id>`) used for targeted notification delivery, independent of
whatever chat rooms it's also joined.

Chat and notifications share this one connection; there's no separate
socket namespace per feature, since the auth/connection overhead isn't
worth it at this scale.

## Frontend state

Redux Toolkit is used narrowly — **only for auth state**
(`redux/slices/authSlice.ts`). Everything else (vehicle lists, bookings,
analytics, chat messages) is local component state populated by direct
API calls in `useEffect`, not a global cache. This was a deliberate
scope decision: a library like React Query would give you request
deduplication and background refetching, but introducing it on top of
the existing pattern this late would mean rewriting every page rather
than extending one. If the app grows past this point, React Query (or
RTK Query, reusing the store that's already there) is the natural next
step.

## What's deliberately not built

See [`DATABASE.md`'s Known Gaps section](./DATABASE.md#known-gaps-honest-not-hidden)
for the specific models/fields that exist but aren't fully wired up
(reviews, maintenance records, coupon admin UI, wallet debits/credits,
owner KYC enforcement, rental agreement PDFs). These aren't bugs —
they're scoped-out phases, documented rather than silently absent.
