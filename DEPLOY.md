# Deploying Buddi to Railway (GitHub auto-deploy)

This puts **both** the Postgres DB and the backend on Railway, with a public HTTPS
URL the phone/web app can reach from anywhere. The repo is already committed locally
with secrets gitignored.

---

## 0. One-time: confirm no secrets are committed

Already verified, but to re-check anytime:

```powershell
git check-ignore -v .env backend/.env   # both should print as ignored
```

Real `.env` files stay on your machine. Secrets go into Railway's UI (step 3).

---

## 1. Push to GitHub

Create an empty repo on github.com (no README/license — we already have commits),
then:

```powershell
git remote add origin https://github.com/<you>/buddi.git
git push -u origin main
```

---

## 2. Create the backend service on Railway

1. Railway dashboard → your existing project (the one with Postgres) → **New** → **GitHub Repo** → pick `buddi`.
2. Open the new service → **Settings**:
   - **Root Directory:** `backend`   ← important, the backend is in a subfolder
   - Build/start come from `backend/railway.json` automatically
     (build: `npm run build`, start: `npm run start`).
3. **Settings → Networking → Generate Domain** to get a public URL like
   `https://buddi-backend-production.up.railway.app`.

---

## 3. Set the backend's environment variables

Service → **Variables** tab. Add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Reference the Postgres service's **internal** URL — see below |
| `JWT_SECRET` | (copy from your local `backend/.env`) |
| `JWT_REFRESH_SECRET` | (copy from your local `backend/.env`) |
| `NODE_ENV` | `production` |

`PORT` is injected by Railway automatically — do **not** set it.

**DATABASE_URL — use the internal reference**, not the public proxy. In the
Variables UI click **Add Reference → Postgres → `DATABASE_URL`**. This wires up the
private-network URL (`postgres.railway.internal`), which is faster and needs no SSL.
The db client already detects `.railway.internal` and disables SSL for it.

(If for some reason you must use the public proxy URL instead, the client handles
that too — it enables SSL for `*.rlwy.net`.)

---

## 4. Create the database tables (run the migration once)

The schema/seed haven't been applied to the DB yet. Two options:

**A — from your machine (uses the public proxy URL already in backend/.env):**
```powershell
cd backend
npm run seed     # creates tables + loads venues/questions on Railway
```

**B — from Railway** (Service → run a one-off command, or temporarily set the
start command to `npm run seed && npm run start` for one deploy, then revert).

Option A is simplest. It's idempotent (safe to re-run).

---

## 5. Point the app at the deployed backend

Edit `.env` (frontend, repo root):
```
EXPO_PUBLIC_API_URL=https://buddi-backend-production.up.railway.app
```
(Use YOUR generated domain. No trailing slash.)

Restart Expo so it picks up the new env var:
```powershell
npx expo start --clear
```

Now register/login works on **web and phone** — the API is public, so no
localhost/LAN-IP issues. Scan the QR with Expo Go (SDK 54) and create an account.

---

## 6. Verify

- Visit `https://<your-domain>/health` in a browser → `{"ok":true,...}`
- Create an account in the app → should succeed and land on the Daily tab.

---

## Day-to-day

- `git push` → Railway auto-rebuilds and redeploys the backend.
- Schema changes: add a new `Schema/<version>/` folder, bump `VERSION` in
  `backend/src/db/migrate.ts`, run `npm run seed` again.

---

## Security TODO

⚠️ The Postgres password was pasted in chat during setup. Rotate it:
Railway → Postgres service → **Variables / Settings → regenerate password**.
Then update your local `backend/.env`. The deployed backend uses the internal
reference, so it updates automatically.
