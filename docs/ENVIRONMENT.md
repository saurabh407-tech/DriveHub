# Environment Variables

Three `.env.example` files exist — `backend/`, `frontend/`, and the
project root (used by `docker-compose.yml`). This page is the single
authoritative reference for all of them; the `.env.example` files stay
minimal on purpose.

Only two variables are ever *required*. Everything else has a working
fallback — see [Architecture → The "graceful fallback" pattern](./ARCHITECTURE.md#the-graceful-fallback-pattern).

## Backend (`backend/.env`)

| Variable | Required? | Default / Fallback | Notes |
|---|---|---|---|
| `NODE_ENV` | no | `development` | `production` disables the stack trace in error responses |
| `PORT` | no | `5000` | |
| `CLIENT_URL` | no | `http://localhost:5173` | used for CORS and the refresh-cookie's implicit origin |
| `MONGO_URI` | **yes** | — | throws at boot if missing. Atlas connection string or local `mongodb://localhost:27017/drivehub` |
| `JWT_ACCESS_SECRET` | **yes** | — | throws at boot if missing. Generate with `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | **yes** | — | must differ from the access secret |
| `JWT_ACCESS_EXPIRES_IN` | no | `15m` | |
| `JWT_REFRESH_EXPIRES_IN` | no | `7d` | |
| `COOKIE_SECRET` | no | `dev_cookie_secret` | change this in production |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `EMAIL_FROM` | no | logs email to console | any SMTP provider works (Gmail app password, SendGrid, Postmark, etc.) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | no | — | reserved; Google OAuth login isn't implemented yet (`POST /auth/google` returns `501`) |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | no | 15 min / 200 | applies to the general `/api` limiter; auth/OTP endpoints have their own stricter, hardcoded limits |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | no | local disk (`backend/uploads/`) | all three must be set together to activate Cloudinary |
| `SERVER_URL` | no | `http://localhost:5000` | only used to build absolute URLs for locally-stored uploads |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | no | mock payment mode | both must be set together to activate real Razorpay |

## Frontend (`frontend/.env`)

| Variable | Required? | Default / Fallback | Notes |
|---|---|---|---|
| `VITE_API_URL` | no | `http://localhost:5000/api/v1` | in Docker, built as `/api/v1` (relative) so Nginx can proxy it |
| `VITE_GOOGLE_MAPS_API_KEY` | no | plain text address inputs | also derives the Socket.io URL by stripping `/api/v1` from `VITE_API_URL` — see `services/socket.ts` |

## Root (`.env`, used only by `docker-compose.yml`)

Mirrors the backend variables above, read into the `backend` service's
`environment:` block, plus `VITE_GOOGLE_MAPS_API_KEY` (passed as a Docker
build arg to the frontend image, since Vite env vars are baked in at
build time, not read at container runtime).

`JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` use Compose's
`${VAR:?error message}` syntax — `docker compose up` will refuse to
start with a clear error if you haven't set them, rather than silently
booting with an insecure default.

## Generating secrets

```bash
openssl rand -hex 32
```
Run this three times for `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and
`COOKIE_SECRET` — never reuse one secret for multiple purposes.
