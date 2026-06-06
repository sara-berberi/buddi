# Buddi — Progress

Last updated: 2026-06-06

> Status reflects what exists **on disk**. Code is written but NOT yet run against
> a live DB or server — nothing below is marked ✅ "verified" until we link the
> Railway DB and start the backend. See "Next: Link the DB" at the bottom.

---

## Legend
- ✅ Written (code on disk)
- 🔍 Written, not yet run/verified
- 🔄 In progress
- ⏳ Next up
- ❌ Blocked
- 💡 Planned (not started)

---

## Infrastructure

- ✅ claude.md / spec.md / decisions.md / progress.md
- ✅ Expo project files (package.json, app.json, tsconfig, babel.config.js) — **SDK 54** (React 19, RN 0.81, Expo Router v6)
- ✅ Deps installed; `expo install --check` clean; typecheck + web bundle pass
- ⏳ Fonts loaded (Fraunces + Instrument Sans + DM Mono) — currently using system fallback; font files not added yet
- ✅ `lib/constants.ts` — colors, spacing, typography
- ✅ `types/index.ts` — all TypeScript types
- ✅ Backend (Node + Express + raw pg)
- ✅ `backend/src/db/client.ts` — pg Pool + query/queryOne/execute/withTransaction
- ✅ `backend/src/db/migrate.ts` — runs Schema + Dati against DATABASE_URL
- ⏳ Railway PostgreSQL provisioned (URL supplied; tables NOT yet created)
- ⏳ `Schema/1.1.0/create_tables.sql` executed on Railway
- ⏳ `Dati/1.1.0/seed.sql` executed on Railway
- ⏳ Backend deployed to Railway
- ✅ `.env` files (frontend + backend; real DATABASE_URL in backend/.env, gitignored)
- 🔍 `npx expo export --platform web` bundles cleanly (728 modules); dev server not yet run interactively

---

## Auth

- ✅ `POST /auth/register`
- ✅ `POST /auth/login`
- ✅ `POST /auth/refresh` (rotating refresh tokens)
- ✅ `POST /auth/logout`
- ✅ `POST /auth/onboarding`
- ✅ `GET /auth/me`
- ✅ JWT middleware (`backend/src/middleware/auth.ts`)
- ✅ `lib/auth.ts` — AsyncStorage token helpers
- ✅ `hooks/useAuth.ts` — auth state + actions
- ✅ Splash + login/register screen (`app/auth/index.tsx`)
- ✅ Onboarding questions (`app/auth/onboard.tsx`)
- ✅ Auth gate in root layout (`app/_layout.tsx`)

---

## Garden

- ✅ `GET /friendships` — list with server-computed health
- ✅ `GET /friendships/pending`
- ✅ `GET /friendships/:id` — detail + history
- ✅ `POST /friendships/invite`
- ✅ `POST /friendships/:id/accept`
- ✅ `POST /friendships/:id/contact` — "we just hung out"
- ✅ `POST /friendships/:id/miss-you`
- ✅ `PlantSVG.tsx` — 5 health states, animated sway
- ✅ Garden screen — 2-column plant grid + invite + pending invites
- ✅ Wilting alert banner
- ✅ Friend Detail screen (hero, miss-you, quests, history)
- ✅ Add Friend (inline in Garden, by username)

---

## Daily Question

- ✅ `GET /daily/today` — question + gated friends' answers
- ✅ `POST /daily/answer` — no update endpoint (uneditable)
- ✅ `GET /daily/history`
- ✅ Daily screen (question, composer, lock state, revealed answers)
- ✅ AnswerCard component
- ✅ Daily question seed (25 questions in Dati)
- 💡 Push notification trigger (mobile only)

---

## Quests

- ✅ `GET /quests` — city-wide, filterable
- ✅ `GET /quests/friendship/:id` — variety-weighted, max 3
- ✅ `GET /quests/venue/:id` — full detail
- ✅ QuestCard component
- ✅ Tonight tab (city header, filter pills, cards)
- ✅ Quest Detail screen (venue, topics, Let's go / Show another)

---

## Profile

- ✅ `GET /users/me` (+ stats)
- ✅ `PATCH /users/me`
- ✅ `GET /users/search`
- ✅ Profile screen (avatar, stats, past answers, logout)

---

## Tab Navigation

- ✅ Tab bar (Daily, Garden, Tonight center amber, Profile)
- ✅ Root layout with auth gate
- ⏳ Expo Router web navigation working (not yet run)

---

## Database

- ✅ `Schema/1.1.0/create_tables.sql` (11 tables)
- ✅ `Dati/1.1.0/seed.sql` (12 Tirana venues, 15 topics, 25 daily questions)
- ⏳ Tables created on Railway

---

## Next: Link the DB

The Railway DATABASE_URL is already in `backend/.env`. To bring it online:

```bash
cd backend
npm install
npm run seed      # creates tables + loads seed data on Railway
npm run dev       # starts the API on http://localhost:3000

# in another terminal, from repo root:
npm install
npx expo start --web
```

Then walk the Testing Checklist below.

---

## Testing Checklist (before showing anyone)

- ⏳ Register a new user in the browser
- ⏳ Complete onboarding
- ⏳ Add a friend by username
- ⏳ See the friend as a plant in the Garden
- ⏳ Answer today's daily question
- ⏳ See friend's answer revealed after posting
- ⏳ Browse Tonight tab and see venue quests
- ⏳ Tap a quest and see venue + topics
- ⏳ Tap "Miss You" on a friend
- ⏳ All of the above works in Chrome (`npx expo start --web`)

---

## Phase 2 (not started)

- 💡 Venue owner registration web form
- 💡 Premium subscription
- 💡 "Miss You" auto-quest generation
- 💡 Push notifications (mobile)
- 💡 Multi-city expansion

---

## Known Issues

- Font files (Fraunces / Instrument Sans / DM Mono) are referenced in
  `lib/constants.ts` but not yet bundled. The app falls back to system fonts
  until the .ttf assets are added and loaded via expo-font.

---

## Notes

- Always run `npx expo start --web` to test — Expo Go not available from work
- Backend must be running locally on port 3000 for web to connect
- Venue data currently seeded for Tirana only
- Plant health/colors always come from the API (`backend/src/lib/health.ts`)
- ⚠️ Rotate the Railway Postgres password once development settles — the URL was
  pasted in chat during setup.
