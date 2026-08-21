# Deployment

Three ways to run this in production, from least to most hands-on.

### Option A — Docker Compose (recommended for most cases)

Runs MongoDB, the backend, and the frontend (served by Nginx) together on one machine.

```bash
cp .env.example .env
# edit .env — at minimum set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET
# (generate with: openssl rand -hex 32)
docker compose up -d --build
```

- Frontend: `http://localhost:8080`
- Backend health check: `http://localhost:5000/health`
- MongoDB data persists in the `mongo_data` volume; uploaded files (when
  Cloudinary isn't configured) persist in `backend_uploads`.
- The frontend's Nginx config (`frontend/nginx.conf`) proxies `/api`,
  `/uploads`, and `/socket.io` to the backend container, so the browser
  only ever talks to one origin.
- Rebuild after pulling code changes: `docker compose up -d --build`.
- Logs: `docker compose logs -f backend` (or `frontend` / `mongo`).

### Option B — VPS with PM2 + Nginx (no Docker)

For a single Ubuntu/Debian server you manage directly:

```bash
# Backend
cd backend
npm ci && npm run build
npm install -g pm2
pm2 start ecosystem.config.js --env production
pm2 save && pm2 startup   # keeps it running across reboots

# Frontend
cd ../frontend
npm ci && npm run build   # outputs to frontend/dist
```

Then install Nginx and use `deploy/nginx.vps.conf` as a starting point —
it serves `frontend/dist` as static files and reverse-proxies
`/api`, `/uploads`, and `/socket.io` to the PM2-managed backend on
`localhost:5000`. Run `certbot --nginx -d your-domain.com` afterward for
free HTTPS.

You'll still need a MongoDB instance — either install it locally or use
MongoDB Atlas's free tier and point `MONGO_URI` at it.

### Option C — Managed platforms (Vercel + Render)

Matches the tech stack's original intent: frontend on Vercel, backend on
Render.

- **Frontend (Vercel)**: import the repo, set the root directory to
  `frontend`, framework preset "Vite". Add `VITE_API_URL` (your Render
  backend URL + `/api/v1`) and, optionally, `VITE_GOOGLE_MAPS_API_KEY` as
  environment variables.
- **Backend (Render)**: create a Web Service from the repo with root
  directory `backend`, build command `npm ci && npm run build`, start
  command `node dist/server.js`. Add the same environment variables as
  `backend/.env.example`, plus `MONGO_URI` pointing at MongoDB Atlas and
  `CLIENT_URL` set to your Vercel URL (needed for CORS and cookies).
- Render's free tier uses ephemeral disk, so set real Cloudinary
  credentials there rather than relying on the local-upload fallback.

### CI

`.github/workflows/ci.yml` runs on every push/PR to `main`: typechecks
and builds both apps, then builds both Docker images (without pushing
them) to catch Dockerfile breakage early. Wire in a deploy step (Render
deploy hook, `vercel --prod`, or `docker push` to a registry) once you
have real hosting credentials to put in GitHub Secrets.

> **Note on scope**: Docker wasn't available in the sandbox this project
> was built in, so the Dockerfiles and Compose setup above are written
> correctly against standard, well-established patterns but haven't been
> build-tested end-to-end. Everything else (both apps' typecheck + build,
> the CI YAML, the Nginx configs) has been verified. Run
> `docker compose up -d --build` and open an issue-equivalent (or just
> ask) if anything doesn't come up cleanly.
