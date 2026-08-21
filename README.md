# DriveHub — Smart Vehicle Rental & Fleet Management Platform

A full MERN-stack vehicle rental platform — think Turo/Zoomcar — with
three roles (customer, owner, admin), real bookings and payments, live
chat and location tracking, and admin tooling. Built incrementally,
phase by phase; every zip you receive is the **entire project so far**,
so you always just unzip over your existing folder to get the latest
working state.

**Every external integration (Cloudinary, Razorpay, Google Maps, SMTP)
gracefully falls back to a working local substitute if you haven't
configured it** — so the whole app runs and is fully demoable with zero
third-party accounts. See [Architecture](./docs/ARCHITECTURE.md#the-graceful-fallback-pattern)
for how.

## Tech stack

React 19 · Vite · TypeScript · Tailwind CSS v4 · Redux Toolkit · Node.js
· Express · MongoDB · Mongoose · Socket.io · JWT · Razorpay · Cloudinary
· Google Maps · PDFKit · Jest · Vitest · Docker

## Documentation

| Doc | What's in it |
|---|---|
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Stack, folder structure, auth flow, RBAC, the booking→payment→trip lifecycle, real-time layer, and *why* — plus what's deliberately not built |
| [`docs/API.md`](./docs/API.md) | Full REST + Socket.io reference, written directly from the route files |
| [`docs/DATABASE.md`](./docs/DATABASE.md) | Every model's schema, relations, indexes — and an honest "known gaps" list |
| [`docs/ENVIRONMENT.md`](./docs/ENVIRONMENT.md) | Every environment variable across all three `.env.example` files, in one place |
| [`docs/TESTING.md`](./docs/TESTING.md) | How to run the test suites, what they cover, what they don't |
| [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) | Docker Compose, VPS + PM2 + Nginx, or Vercel + Render |
| [`docs/CONTRIBUTING.md`](./docs/CONTRIBUTING.md) | Code conventions and the five-file shape every resource follows |
| [`CHANGELOG.md`](./CHANGELOG.md) | What shipped in each phase |

## Getting started

### 1. Backend

```bash
cd backend
cp .env.example .env
# edit .env — at minimum set MONGO_URI to a MongoDB Atlas connection string
# (SMTP and Cloudinary are optional — both have working local fallbacks)
npm install
npm run dev
```

API starts on `http://localhost:5000`. Health check: `GET /health`.

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App starts on `http://localhost:5173`.

### Try it end-to-end

1. Register an **owner** account. Verify via the OTP printed in the
   backend console (`[DEV EMAIL]` log line, since SMTP isn't configured
   by default).
2. Log in, go to **Vehicles → Add vehicle**, fill in the form.
3. On the vehicle's manage page, upload a couple of photos and the RC +
   insurance documents (any small JPEG/PNG/PDF works — they're stored
   locally under `backend/uploads` unless you've configured Cloudinary).
4. Click **Submit for verification**.
5. Since the vehicle needs admin approval to go live, the easiest path in
   dev is to promote your own account: in MongoDB, set that user's `role`
   to `admin` temporarily, log back in, then call
   `POST /api/v1/vehicles/:id/verify` (e.g. via curl/Postman) to publish
   it. Set `role` back to `owner` afterwards if you want to keep testing
   as that account.
6. Visit `/vehicles` (no login required) — your vehicle now appears in
   the public search and browse grid.
7. Register a separate **customer** account (or log out and back in as
   one), open the vehicle, pick dates and addresses, and click **Book
   this vehicle** — this creates a `pending_payment` booking and takes you
   to checkout.
8. Click **Simulate payment** (shown automatically since no Razorpay keys
   are configured). The booking flips to `confirmed`, an invoice PDF is
   generated, and you're redirected to **Your bookings**.
9. Open the booking to see the price breakdown, download the invoice, or
   cancel it — cancelling triggers the refund policy and, since the
   payment was captured, a mock refund against it.
10. On the same booking page, click **Start trip**, then open the "Share
    my location" toggle (allow the browser location permission prompt) —
    your position appears on the live tracking map. Click **Mark
    completed** to finish the trip. Set `VITE_GOOGLE_MAPS_API_KEY` in
    `frontend/.env` for the full Places-autocomplete + draggable-pin
    experience; without it, addresses are still plain text and everything
    else in this flow still works.
11. Still on the booking page, scroll to **Message owner/customer** and
    send a message — open the same booking in a second browser (logged in
    as the other party) to see it arrive live. The **Messages** link in
    the sidebar lists every conversation.
12. Log in as your admin account and open the dashboard — you'll see real
    revenue and booking numbers now. Try **Admin → Users** to ban/unban an
    account, or send a broadcast from the dashboard and watch the bell
    icon light up live for any logged-in user.

See [`docs/TESTING.md`](./docs/TESTING.md) for how to run the test suites
and [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) for Docker/VPS/managed
hosting instructions.

## Roadmap

| Phase | Scope | Status |
|---|---|---|
| 1–3 | Backend foundation, auth | ✅ Done |
| 4 | Remaining database models | ✅ Done |
| 5 | Vehicle module | ✅ Done |
| 6 | Booking module — creation, availability locking, cancellation, refunds | ✅ Done |
| 7 | Payments — Razorpay integration, invoices | ✅ Done |
| 8 | Google Maps — pickup/drop location picking, live trip tracking | ✅ Done |
| 9 | Real-time chat (Socket.io) | ✅ Done |
| 10 | Full dashboards (revenue, analytics, disputes) | ✅ Done |
| 11 | Notifications (real-time + broadcast) | ✅ Done |
| 12 | Analytics & reporting | Folded into Phase 10 |
| 13 | Frontend polish (code-splitting, a11y, skeletons, motion) | ✅ Done |
| 14 | Testing (Jest + Vitest) | ✅ Done |
| 15 | Deployment (Docker, CI/CD, Nginx, PM2) | ✅ Done |
| 16 | Documentation | ✅ Done |

All sixteen phases are complete. The project is feature-complete,
tested, documented, and deployable. Reply with anything you'd like
refined, extended, or hardened further and it'll be built on top of this
codebase without touching what already works.

## License

[MIT](./LICENSE)
