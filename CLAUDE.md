# Buddi — Claude Context

> Read this before touching anything in this project.

---

## What is Buddi

Buddi is a friendship tracker app. Three features. Nothing else.

1. **Garden** — every friendship is a plant. It grows or wilts based on days since last contact.
2. **Daily Question** — one question per day, text only, uneditable after posting. You see friends' answers only after you post yours. Like BeReal but with words, not photos.
3. **Quests** — activity and date ideas at venues registered on the platform. Shown inside each friendship detail AND in a dedicated "Tonight" discovery tab.

Buddi is not a dating app. Not a matching platform.
The matching / open mode / stranger-meeting was deliberately cut. Do not add it back.

> **Updated 2026-06-06 (DEC-P012):** Buddi now HAS a friends-only social layer —
> text statuses, a friends' feed, like/repost/share, and DMs. This reversed the
> original "no social feed" rule. Still friends-only and text-first (no photo
> feed, no strangers). The Daily Question remains separate and uneditable.

---

## Running the App

### Primary — Expo Web (no phone needed)
```bash
cd buddi
npm install
npx expo start --web
# Opens at http://localhost:8081
```

### Secondary — Expo Go (when available)
```bash
npx expo start
# i = iOS simulator
# a = Android emulator
# Scan QR with Expo Go app
```

> Work computer cannot link with Expo Go.
> Always verify every feature works in the browser first.

---

## Tech Stack

### Frontend
- **Expo SDK 54** + **Expo Router v6** (file-based routing)
  - (Upgraded from SDK 52 → 54 on 2026-06-06 so current Expo Go, which supports SDK 54–55, can run it. React 19 + RN 0.81.)
- **React Native + React Native Web** — one codebase, runs in browser
- **TypeScript** — strict mode, always
- **react-native-svg** — plant visualizations (web-compatible)
- **TanStack Query v5** — all server state
- **Zustand** — auth user only (minimal client state)
- **AsyncStorage** — token storage (works on web; SecureStore does not)

### Backend
- **Node.js + Express**
- **pg** (node-postgres) — raw SQL queries, no ORM
- **PostgreSQL on Railway**
- **JWT** — access token 15min + refresh token 30 days

### Database
- `Schema/` — versioned CREATE TABLE files, run manually
- `Dati/` — versioned INSERT seed files, run manually
- All statements use IF NOT EXISTS / ON CONFLICT DO NOTHING

---

## Project Structure

```
buddi/
├── app/
│   ├── _layout.tsx              # Root layout, auth gate, QueryClient
│   ├── auth/
│   │   ├── index.tsx            # Splash
│   │   └── onboard.tsx          # Onboarding questions
│   └── tabs/
│       ├── _layout.tsx          # Tab bar
│       ├── daily.tsx            # Daily question screen
│       ├── garden.tsx           # Plant grid
│       ├── tonight.tsx          # Quest discovery
│       └── profile.tsx          # Profile + answer history
├── friendship/
│   └── [id].tsx                 # Friend detail + quest suggestions
├── quest/
│   └── [id].tsx                 # Full quest suggestion screen
├── components/
│   ├── plants/PlantSVG.tsx      # SVG plant, 5 states, animated
│   ├── daily/AnswerCard.tsx     # Daily answer card
│   ├── quest/QuestCard.tsx      # Venue quest card
│   └── ui/                      # Button, Avatar, Badge
├── lib/
│   ├── api.ts                   # All API calls — edit here first
│   ├── auth.ts                  # Token management (AsyncStorage)
│   ├── constants.ts             # Colors, fonts, spacing
│   └── utils.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useFriendships.ts
│   └── useDaily.ts
├── types/index.ts
├── Schema/1.1.0/create_tables.sql
├── Dati/1.1.0/seed.sql
└── backend/
    ├── src/
    │   ├── index.ts
    │   ├── routes/
    │   │   ├── auth.ts
    │   │   ├── friendships.ts
    │   │   ├── daily.ts
    │   │   └── quests.ts
    │   ├── middleware/auth.ts
    │   └── db/client.ts
    └── package.json
```

---

## Web Compatibility Rules

Always handle these differences explicitly:

| Feature | Mobile | Web | Action |
|---|---|---|---|
| AsyncStorage | ✅ | ✅ | Use everywhere |
| SecureStore | ✅ | ❌ | Never use |
| react-native-svg | ✅ | ✅ | Fine as-is |
| Push notifications | ✅ | ❌ | Wrap in Platform.OS check |
| expo-font | ✅ | ✅ | Fine as-is |
| Animated | ✅ | ✅ | Fine as-is |

```ts
// Correct pattern for notifications
if (Platform.OS !== 'web') {
  await Notifications.scheduleNotificationAsync(...)
}
```

---

## Design System

Colors — always from `lib/constants.ts`, never hardcoded:

```
forest:   #163324   primary — buttons, nav, key UI
amber:    #C87828   accent — badges, CTA, highlights
cream:    #F4EDE0   background
ink:      #0C1A0E   primary text
surface:  #FDFAF5   cards and surfaces
muted:    #8A7E6E   secondary text
border:   #DDD4C4   dividers and borders
```

Typography:
- Headers → Fraunces italic (serif)
- Body → Instrument Sans
- Numbers / stats → DM Mono

---

## Plant Health States

| State | Days without contact | Stem color |
|---|---|---|
| flourishing | 0–7 | #2A6E44 |
| good | 8–20 | #3A7A52 |
| fading | 21–35 | #8AB030 |
| wilting | 36–55 | #C89030 |
| critical | 56+ | #C44A3A |

Health and color are always computed from `days_since_contact`.
Never compute plant health on the client. Always comes from the API.

---

## Environment Variables

### Frontend — `.env`
```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### Backend — `.env`
```
DATABASE_URL=postgresql://...
JWT_SECRET=at-least-32-random-chars
JWT_REFRESH_SECRET=at-least-32-different-random-chars
PORT=3000
NODE_ENV=development
```

---

## Hard Rules

- No dating or matching features — ever
- No SecureStore — breaks on web
- No social feed with photos
- No open mode / meeting strangers
- No Prisma or any ORM — raw SQL only
- No hardcoded hex colors
- No features outside spec.md
