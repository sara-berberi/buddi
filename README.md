# Buddi

A friendship tracker. Three features: **Garden** (friendships as plants), **Daily Question** (one uneditable text answer a day), and **Quests** (venue date/activity ideas). See [spec.md](spec.md) and [claude.md](claude.md).

## Layout

```
.                 # Expo + React Native Web frontend (app/, lib/, hooks/, components/, types/)
backend/          # Node + Express + raw pg API
Schema/1.1.0/     # CREATE TABLE files (run manually / via migrate)
Dati/1.1.0/       # seed data (venues, topics, daily questions)
```

## Run it

The Railway `DATABASE_URL` is already in `backend/.env` (gitignored).

**1. Backend + DB**
```bash
cd backend
npm install
npm run seed      # creates tables + loads seed data on Railway (idempotent)
npm run dev       # API on http://localhost:3000
```

**2. Frontend (web — primary dev target)**
```bash
npm install
npx expo start --web   # http://localhost:8081
```

## Notes

- Plant health is always computed on the server (`backend/src/lib/health.ts`); the client only renders it.
- Tokens live in AsyncStorage (works on web; SecureStore is never used).
- Raw SQL only — no ORM. Schema/seed files are idempotent and run manually or via `npm run seed`.
- Daily answers have **no update endpoint** — they are uneditable by design.
- ⚠️ Rotate the Railway Postgres password once setup settles (the URL was shared in chat).
