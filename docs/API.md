# API Reference

Base URL: `http://localhost:5000/api/v1` (or your deployed backend + `/api/v1`)

All responses follow the shape:
```json
{ "success": true, "message": "...", "data": { ... } }
```
Errors follow:
```json
{ "success": false, "message": "...", "errors": { "field": "reason" } }
```

**Auth**: routes marked 🔒 require an `Authorization: Bearer <accessToken>`
header. Routes marked with a role (e.g. 🔒`owner`) additionally require
the authenticated user to have that role. The access token is obtained
from `/auth/login` and refreshed via the httpOnly cookie set by that same
call — see [Authentication](#authentication) below.

---

## Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Create an account (`customer` or `owner`). Sends an OTP to the given email. |
| POST | `/auth/verify-otp` | — | Verify the OTP from registration. `{ email, otp }` |
| POST | `/auth/resend-otp` | — | Resend the verification OTP. `{ email }` |
| POST | `/auth/login` | — | `{ email, password }` → `{ user, accessToken }` + sets an httpOnly refresh cookie |
| POST | `/auth/refresh-token` | — | Reads the refresh cookie, returns a new `accessToken` and rotates the cookie |
| POST | `/auth/logout` | 🔒 | Revokes the current refresh token |
| POST | `/auth/forgot-password` | — | `{ email }` — always returns success, regardless of whether the account exists |
| POST | `/auth/reset-password` | — | `{ email, token, password }` |
| GET | `/auth/me` | 🔒 | Returns the current user |
| POST | `/auth/google` | — | Reserved for a future phase; currently returns `501` |

Rate limits: `authLimiter` (20 requests / 15 min) on register/login/
forgot-password/reset-password; `otpLimiter` (5 requests / 10 min) on
OTP endpoints.

## Users

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/users/me` | 🔒 | Get your own profile |
| PATCH | `/users/me` | 🔒 | Update `name`, `phone`, `dateOfBirth`, `address`, `emergencyContact` (whitelisted — role/email/password can't be changed here) |
| GET | `/users` | 🔒`admin` | Paginated user list. Query: `page`, `limit`, `role` |
| GET | `/users/owner/verification-status` | 🔒`owner` | Owner KYC status |
| POST | `/users/:id/ban` | 🔒`admin` | `{ reason }` — bans the account, force-logs-out everywhere, audit-logged |
| POST | `/users/:id/unban` | 🔒`admin` | Reinstates the account, sends a notification |

## Vehicles

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/vehicles` | — | Search/browse. Query: `page`, `limit`, `city`, `category`, `fuelType`, `transmission`, `minPrice`, `maxPrice`, `seats`, `q` (free text), `sortBy` (`price_asc`\|`price_desc`\|`rating`\|`newest`), `startDate`+`endDate` (excludes vehicles booked in that range) |
| GET | `/vehicles/owner/mine` | 🔒`owner` | List your own listings, any status |
| GET | `/vehicles/admin/pending` | 🔒`admin` | Vehicles awaiting verification |
| POST | `/vehicles` | 🔒`owner` | Create a listing (starts as `draft`) |
| GET | `/vehicles/:id` | — | Vehicle detail |
| GET | `/vehicles/:id/availability` | — | Query: `startDate`, `endDate` → `{ available: boolean }` |
| PATCH | `/vehicles/:id` | 🔒`owner`/`admin` | Update editable fields (title, description, features, pricing, location, etc.) |
| DELETE | `/vehicles/:id` | 🔒`owner`/`admin` | Soft-delete (marks inactive) |
| POST | `/vehicles/:id/submit-verification` | 🔒`owner` | Moves `draft` → `pending_verification`. Requires ≥1 photo and both RC + insurance uploaded |
| POST | `/vehicles/:id/images` | 🔒`owner`/`admin` | Multipart `images` (up to 10, 5MB each, JPEG/PNG/WebP) |
| DELETE | `/vehicles/:id/images/:publicId` | 🔒`owner`/`admin` | Remove one image |
| POST | `/vehicles/:id/documents/:docType` | 🔒`owner` | `docType` = `rc`\|`insurance`\|`pollutionCertificate`. Multipart `document` (JPEG/PNG/WebP/PDF, 8MB) |
| POST | `/vehicles/:id/verify` | 🔒`admin` | Publishes the vehicle (`active`), notifies the owner |
| POST | `/vehicles/:id/reject` | 🔒`admin` | `{ reason }` — rejects, notifies the owner |

## Bookings

All routes require 🔒 authentication.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/bookings` | `customer` | `{ vehicleId, startDate, endDate, pickupLocation: { address, lat?, lng? }, dropLocation: {...}, couponCode? }`. Computes pricing server-side, blocks the vehicle's calendar, starts as `pending_payment` |
| GET | `/bookings/mine` | `customer` | Your bookings. Query: `page`, `limit`, `status` |
| GET | `/bookings/owner` | `owner` | Bookings against your vehicles |
| GET | `/bookings` | `admin` | All bookings |
| GET | `/bookings/:id` | any participant/`admin` | Full booking detail |
| POST | `/bookings/:id/cancel` | participant/`admin` | `{ reason? }` — applies the refund policy, releases the calendar hold, refunds a captured payment if one exists |
| POST | `/bookings/:id/start` | participant | `confirmed` → `ongoing` |
| POST | `/bookings/:id/complete` | participant | `ongoing` → `completed`, releases the calendar hold |
| POST | `/bookings/:id/location` | participant | `{ lat, lng }` — only while `ongoing` |
| GET | `/bookings/:id/location` | participant | Last known shared location, or `null` |

**Refund policy**: full refund ≥24h before `startDate`, 50% within 24h,
none once the trip has started or is `ongoing`.

## Payments

All routes require 🔒 authentication.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/payments/orders` | `customer` | `{ bookingId }` → creates a Razorpay order (or a mock order if no keys configured) |
| POST | `/payments/verify` | `customer` | `{ razorpayOrderId, razorpayPaymentId?, razorpaySignature? }` — verifies the signature (skipped for mock orders), captures the payment, confirms the booking, generates an invoice PDF |
| GET | `/payments/booking/:bookingId` | participant | The payment record for a booking |

## Chat

All routes require 🔒 authentication. Real-time delivery is over
Socket.io (see [Socket.io Events](#socketio-events)) — these REST routes
cover history and conversation management.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/chat/conversations` | any | Your conversations, most recent first |
| POST | `/chat/conversations` | any | `{ bookingId }` — gets or creates the conversation for that booking |
| GET | `/chat/conversations/:id/messages` | participant | Query: `page`, `limit` (default 30) |
| POST | `/chat/conversations/:id/messages` | participant | `{ text }` — REST fallback; the app normally sends via the socket `send_message` event instead |
| POST | `/chat/conversations/:id/read` | participant | Marks all messages from the other party as read |

## Notifications

All routes require 🔒 authentication.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/notifications` | any | Query: `page`, `limit` (default 20) → `{ notifications, unreadCount, pagination }` |
| POST | `/notifications/:id/read` | any | Mark one as read |
| POST | `/notifications/read-all` | any | Mark all as read |
| POST | `/notifications/broadcast` | `admin` | `{ title, message, link? }` — fans out to every active, non-banned user, delivered live to anyone connected |

## Analytics

All routes require 🔒 authentication and the matching role.

| Method | Path | Auth | Returns |
|---|---|---|---|
| GET | `/analytics/owner` | `owner` | `vehicleCount`, `activeBookings`, `completedTrips`, `avgRating`, `thisMonthRevenue`, `monthlyRevenue[6]`, `recentBookings[5]` |
| GET | `/analytics/admin` | `admin` | `totalUsers`, `usersByRole`, `totalVehicles`, `vehiclesByStatus`, `totalBookings`, `platformRevenue`, `monthlyRevenue[6]`, `pendingVerifications`, `recentCancellations[5]` |
| GET | `/analytics/customer` | `customer` | `totalBookings`, `upcomingBookings`, `completedTrips`, `totalSpent` |

## Health check

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | — | `{ success, message, timestamp }` — not under `/api/v1` |

---

## Socket.io Events

Connect with `io(SOCKET_URL, { auth: { token: accessToken } })`. The
handshake is rejected (`Authentication required`/`Unauthorized`) without
a valid access token. On connect, the server joins the socket to a
personal room (`user:<id>`) used for notification delivery.

| Direction | Event | Payload | Description |
|---|---|---|---|
| emit | `join_conversation` | `conversationId` (ack callback) | Joins the room for a conversation you're a participant in |
| emit | `leave_conversation` | `conversationId` | Leaves that room |
| emit | `typing` | `{ conversationId, isTyping }` | Broadcast to the other participant |
| listen | `typing` | `{ userId, isTyping }` | — |
| emit | `send_message` | `{ conversationId, text }` (ack callback) | Persists and broadcasts the message |
| listen | `new_message` | `Message` | Fired to everyone in the conversation's room, including the sender |
| listen | `notification` | `Notification` | Fired to a specific user's personal room whenever one is created |

---

## Errors you'll commonly see

| Status | Meaning |
|---|---|
| 400 | Validation failed, or a business rule was violated (e.g. booking your own vehicle, expired coupon) |
| 401 | Missing/invalid/expired token, or wrong credentials |
| 403 | Authenticated but not authorized for this action (wrong role, not a participant) |
| 404 | Resource not found |
| 409 | Conflict (duplicate email, registration number already listed, overlapping booking dates) |
| 429 | Rate limited |
| 501 | Not implemented yet (Google OAuth only) |
