# Changelog

This project was built incrementally, phase by phase, each one a
complete working slice added on top of the last. This changelog records
what each phase actually delivered — see [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
for how it all fits together and [`docs/DATABASE.md`](./docs/DATABASE.md#known-gaps-honest-not-hidden)
for an honest list of what's scoped out.

## Phases 1–3 — Backend foundation & authentication

- Express + TypeScript backend with an enterprise folder structure
  (config/controllers/services/models/routes/middlewares/validators/utils).
- `User` model covering roles, profile, document upload metadata,
  wallet, and owner KYC fields.
- Full auth flow: register, email OTP verification, login, JWT
  access + refresh tokens (refresh token as a rotated, hashed httpOnly
  cookie), logout, forgot/reset password, RBAC middleware.
- Security baseline: Helmet, CORS, rate limiting, Mongo/XSS sanitization,
  HTTP param pollution protection, bcrypt.
- React 19 + Vite + TypeScript + Tailwind v4 frontend, Redux Toolkit
  auth slice, axios with automatic token refresh, auth pages, role-aware
  dashboard shells.

## Phase 4 — Remaining database models

Vehicle, Booking, Payment, Review, Coupon, Notification,
MaintenanceRecord, Conversation/Message, AuditLog — all modeled with
indexes and relations ahead of the modules that would consume them.

## Phase 5 — Vehicle module

Owner CRUD, image uploads (Cloudinary or automatic local-disk fallback),
RC/insurance document uploads, draft → pending-verification → active
lifecycle, admin verify/reject, public search with filters + pagination
+ sorting, availability checking against blocked date ranges.

## Phase 6 — Booking module

Date-range booking creation with pickup/drop addresses, server-computed
pricing (day-rate × duration, weekly/monthly discounts, GST, security
deposit), calendar-hold via `blockedDates`, and a 24-hour time-based
cancellation refund policy.

## Phase 7 — Payments

Razorpay order creation, signature verification, and refunds — with a
mock mode that activates automatically when no Razorpay keys are
configured, so the full pay → confirm loop works with zero merchant
account. PDFKit-generated invoices attached on successful capture.
Bookings now correctly start `pending_payment` and only confirm once
payment clears (this replaced Phase 6's temporary "instant confirm").

## Phase 8 — Google Maps

Places Autocomplete + draggable-pin location picking (falls back to a
plain text address field without an API key). A trip map with
pickup/drop pins. Trip lifecycle endpoints (`confirmed` → `ongoing` →
`completed`) that didn't previously exist. Live location sharing during
an `ongoing` trip via the browser Geolocation API, polled every 10s.

## Phase 9 — Real-time chat

Socket.io server, JWT-authenticated on the same access token as REST.
Booking-scoped conversations, live message delivery + typing indicators,
a Messages inbox page.

## Phases 10–12 — Full dashboards, notifications & analytics

Folded into one phase since they share the same aggregation-pipeline
work. Owner/admin/customer dashboards now show real MongoDB-aggregated
data (revenue charts, active bookings, ratings) instead of placeholders.
Admin gained a vehicle verification queue, a disputes page, and a
users page with ban/unban (audit-logged). Real-time notifications via
the same socket connection as chat, triggered by payment capture,
booking cancellation, and vehicle verification/rejection; admins can
also send a one-off broadcast.

## Phase 13 — Frontend polish

- **Code-splitting**: every page is now its own lazy-loaded chunk
  (`React.lazy` + `Suspense`), replacing one large bundle. The heaviest
  dependency (recharts, ~330KB) now only loads on the dashboard pages
  that actually render a chart, not on the landing/login/browse pages —
  this eliminated Vite's "chunk larger than 500KB" build warning that
  had been present since Phase 10.
- **Accessibility**: a skip-to-content link, `aria-expanded`/Escape-to-close
  on the notification panel, a `role="log" aria-live="polite"` chat
  transcript with an announced typing indicator, and `aria-hidden` on
  decorative icons/illustrations.
- **Consistent loading skeletons**: shared `Skeleton`/`SkeletonList`/
  `SkeletonGrid` components replace duplicated ad-hoc pulse divs across
  the booking, vehicle, and messages list pages.
- **Motion**: a global `MotionConfig reducedMotion="user"` (so every
  animation respects the OS-level reduced-motion setting automatically),
  an animated notification panel, and a reusable `FadeIn` entrance
  wrapper applied to the three role dashboards.

## Phase 14 — Testing

Jest + Supertest for the backend: 41 unit tests against pure logic
extracted specifically to be testable (`utils/pricing.ts`,
`utils/refundPolicy.ts`, JWT, tokens, `ApiError`), plus an integration
suite exercising the real Express app with `mongodb-memory-server`
(register/login/RBAC). Vitest + React Testing Library for the frontend:
22 tests covering the design-system primitives and the auth Redux slice.
See [`docs/TESTING.md`](./docs/TESTING.md) for exact commands and an
honest list of what isn't covered yet.

## Phase 15 — Deployment

Multi-stage Dockerfiles for both apps, a `docker-compose.yml` wiring
MongoDB + backend + frontend (Nginx) together, a PM2 config + reference
Nginx conf for a no-Docker VPS path, and a GitHub Actions CI workflow
that typechecks, tests, and builds both apps plus both Docker images on
every push/PR. See [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md).

## Phase 16 — Documentation

This changelog, plus [`docs/API.md`](./docs/API.md) (full REST +
Socket.io reference written directly from the route files),
[`docs/DATABASE.md`](./docs/DATABASE.md) (schema reference with an
honest "known gaps" section), [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
(design decisions and why), [`docs/ENVIRONMENT.md`](./docs/ENVIRONMENT.md)
(consolidated env var reference), and [`docs/CONTRIBUTING.md`](./docs/CONTRIBUTING.md).
The root README was trimmed down to an overview + quickstart, linking
into these rather than growing further with every phase.
