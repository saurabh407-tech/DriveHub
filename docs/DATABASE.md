# Database Schema

MongoDB via Mongoose. Ten collections, defined in `backend/src/models/`.
Relations are references (`ObjectId` + `ref`), populated on demand rather
than embedded, except where noted.

## User

The single collection for all three roles (`customer` | `owner` | `admin`)
— see [Architecture → Single User collection](./ARCHITECTURE.md#a-single-user-collection-for-all-three-roles) for why.

| Field | Type | Notes |
|---|---|---|
| `name`, `email`, `phone` | string | `email` unique; `phone` unique+sparse |
| `password` | string, `select: false` | bcrypt hash, absent for Google-only accounts |
| `authProvider` | `'local'` \| `'google'` | |
| `role` | `'customer'` \| `'owner'` \| `'admin'` | indexed |
| `isEmailVerified`, `isPhoneVerified`, `isActive`, `isBanned` | boolean | |
| `banReason` | string | |
| `otpHash`, `otpExpires`, `otpPurpose` | — `select: false` | hashed OTP, never stored raw |
| `emailVerificationTokenHash`, `passwordResetTokenHash` (+ expiry) | — `select: false` | |
| `refreshTokenHash` | string, `select: false` | hashed, rotated on every refresh |
| `drivingLicense`, `governmentId` | embedded doc | `{ url, publicId, status, rejectionReason? }` |
| `address`, `emergencyContact` | embedded doc | |
| `wallet` | embedded doc | `{ balance, currency }` — reserved for a future phase, not yet debited/credited anywhere |
| `ownerVerification` | embedded doc | `{ status, panCardUrl?, bankAccountVerified?, submittedAt? }` — reserved, not yet enforced |
| `lastLoginAt` | Date | |

`toJSON` strips password/refresh/OTP/reset fields automatically — no
route needs to remember to `.select('-password')`.

## Vehicle

| Field | Type | Notes |
|---|---|---|
| `owner` | ref `User` | indexed |
| `title`, `slug` | string | `slug` unique, auto-generated |
| `category` | enum | hatchback\|sedan\|suv\|bike\|scooter\|van\|luxury |
| `make`, `vehicleModel`, `year`, `registrationNumber` (unique) | | note: `model` was renamed to `vehicleModel` — Mongoose Documents reserve `.model()` |
| `fuelType`, `transmission`, `seats`, `mileageKmpl` | | |
| `images` | array | `{ url, publicId, isPrimary }`, max 10 |
| `pricing` | embedded | `{ perHour?, perDay, weeklyDiscountPercent, monthlyDiscountPercent, securityDeposit, currency }` |
| `location` | embedded | `{ address, city, state, country, pincode?, coordinates: GeoJSON Point }` — `2dsphere` indexed |
| `documents` | embedded | `{ rc, insurance, pollutionCertificate? }`, each `{ url, publicId, status, expiresAt?, rejectionReason? }` |
| `blockedDates` | array | `{ from, to, reason: 'booked'\|'maintenance'\|'owner_blocked', bookingId? }` — the calendar-hold mechanism bookings use |
| `status` | enum | draft → pending_verification → active \| rejected; also inactive, maintenance |
| `isDeleted` | boolean, `select: false` | soft delete |
| `ratingAverage`, `ratingCount`, `totalTrips` | number | `ratingAverage`/`ratingCount` are on the schema but not yet written to by the Review flow — see [known gaps](./ARCHITECTURE.md#known-gaps) |

Indexes: `2dsphere` on coordinates, compound `(status, city, category)`,
text index on `(title, make, vehicleModel, description)`, `pricing.perDay`,
`ratingAverage`.

## Booking

| Field | Type | Notes |
|---|---|---|
| `bookingCode` | string, unique | `DH-YYYYMMDD-XXXXXX` |
| `customer`, `vehicle`, `owner` | refs | all indexed |
| `startDate`, `endDate` | Date | |
| `pickupLocation`, `dropLocation` | embedded | `{ address, lat?, lng? }` |
| `pricing` | embedded | `{ baseAmount, discountAmount, taxAmount, securityDeposit, couponCode?, totalAmount, currency }` — computed by `utils/pricing.ts`, never trusted from the client |
| `status` | enum | pending_payment → confirmed → ongoing → completed; or cancelled_by_customer \| cancelled_by_owner \| rejected |
| `cancellation` | embedded | `{ cancelledBy, reason, cancelledAt, refundAmount? }` |
| `agreementUrl` | string | reserved for a rental-agreement PDF; not yet generated anywhere |
| `paymentId` | ref `Payment` | set conceptually but the app currently looks payments up by `booking` instead |
| `tripStartedAt`, `tripCompletedAt` | Date | |
| `tracking` | embedded | `{ lat, lng, updatedBy, updatedAt }` — live location, only while `ongoing` |

Indexes: `(vehicle, startDate, endDate)`, `(customer, createdAt)`,
`(owner, createdAt)`.

## Payment

| Field | Type | Notes |
|---|---|---|
| `booking` | ref `Booking`, indexed | |
| `customer` | ref `User`, indexed | |
| `amount`, `currency` | | |
| `status` | enum | created → captured → refunded \| partially_refunded; or authorized, failed |
| `razorpayOrderId`, `razorpayPaymentId` | string, indexed | prefixed `order_mock_`/`pay_mock_` in mock mode |
| `razorpaySignature` | string, `select: false` | |
| `refunds` | array | `{ razorpayRefundId?, amount, reason?, processedAt }` |
| `invoiceNumber` (unique, sparse), `invoiceUrl` | | set once the PDF is generated post-capture |

## Review

| Field | Type | Notes |
|---|---|---|
| `booking` | ref `Booking`, **unique** | one review per booking |
| `vehicle`, `customer`, `owner` | refs | |
| `rating` | number, 1–5 | |
| `comment`, `images` | | |
| `ownerReply` | embedded | `{ message, repliedAt }` |

> **Not yet wired up**: the model and indexes exist, but no
> controller/route creates a Review, and `Vehicle.ratingAverage` is never
> recalculated from them. See [Known gaps](#known-gaps-honest-not-hidden) below.

## Coupon

| Field | Type | Notes |
|---|---|---|
| `code` | string, unique, uppercased | |
| `discountType` | `'flat'` \| `'percentage'` | |
| `value`, `maxDiscountAmount?`, `minBookingAmount?` | | |
| `usageLimit?`, `usageLimitPerUser?`, `usedCount` | | enforced in `booking.service.ts`'s `applyCoupon` |
| `validFrom`, `validUntil`, `isActive` | | |

Consumed by the booking flow (`couponCode` on create); there's no
admin UI to create coupons yet — they'd currently need to be inserted
directly in MongoDB.

## Notification

| Field | Type | Notes |
|---|---|---|
| `user` | ref `User`, indexed | |
| `type` | enum | booking_confirmed, booking_cancelled, payment_received, document_verified, document_rejected, maintenance_due, admin_broadcast, chat_message, review_received |
| `title`, `message`, `link?` | | |
| `isRead` | boolean | |

Only `createdAt` is tracked (no `updatedAt`). `maintenance_due`,
`chat_message`, and `review_received` are defined types but nothing
currently triggers them — chat has its own read-receipt system instead,
and the maintenance/review modules aren't built yet.

## MaintenanceRecord

| Field | Type | Notes |
|---|---|---|
| `vehicle`, `owner` | refs | |
| `type` | enum | oil_change, insurance_renewal, general_service, tyre_change, other |
| `dueDate`, `completedDate?`, `cost?`, `odometerReading?`, `notes?` | | |
| `isCompleted` | boolean | |

> **Not yet wired up**: no controller/route exists for this model. It's
> here so the schema is ready for a future maintenance-tracking phase.

## Conversation / Message (`Chat.model.ts`)

**Conversation**: `participants: [User]` (2 for a direct owner↔customer
thread), optional `booking` ref, `lastMessageAt`, `lastMessagePreview`.

**Message**: `conversation` ref (indexed), `sender` ref, `text?`,
`attachment?` (`{ url, publicId, type: 'image'|'document' }` — schema
supports attachments but no upload endpoint sends one yet), `isRead`.

## AuditLog

| Field | Type | Notes |
|---|---|---|
| `actor` | ref `User`, indexed | who performed the action |
| `action` | enum | user_banned, user_unbanned, user_role_changed, vehicle_verified, vehicle_rejected, vehicle_removed, document_verified, document_rejected, booking_force_cancelled, refund_issued, coupon_created, coupon_deactivated |
| `targetType`, `targetId` | | polymorphic reference, indexed |
| `metadata?` | Mixed | free-form context |
| `ipAddress?` | | not currently populated by any route |

Currently only `user_banned`/`user_unbanned` are actually written (from
`user.routes.ts`). The enum has more values than the app emits today —
intentionally scoped for admin actions that don't exist yet (e.g.
`vehicle_removed` beyond the soft-delete already in place).

---

## Known gaps (honest, not hidden)

A few things are modeled but not fully wired into the application flow
yet — flagging them here so nothing looks more finished than it is:

- **Reviews**: schema + indexes exist; no create/list endpoints, and
  `Vehicle.ratingAverage`/`ratingCount` are never updated.
- **Maintenance records**: schema exists; no endpoints.
- **Coupons**: consumed by booking creation; no admin CRUD UI yet.
- **Wallet balance**: field exists on `User`; nothing credits or debits it.
- **Owner KYC** (`ownerVerification`): field exists; not enforced before
  a vehicle can be listed.
- **Rental agreement PDF** (`Booking.agreementUrl`): field exists;
  nothing generates it (the invoice PDF, which is a different document,
  is fully implemented).
