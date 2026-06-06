# Buddi — Decisions Log

All significant decisions with reasoning. Add new ones at the bottom with date.

---

## Product Decisions

**DEC-P001: Friendship tracker only — no discovery/matching**
The original concept included Open Mode (meeting strangers through algorithm-generated group outings). This was cut.
*Reason:* Solving one problem well beats solving two problems poorly. Friendship maintenance is a clear, underserved need. Meeting new people is a different product with different mechanics, different safety concerns, and a different go-to-market. Build the tracker, prove traction, add discovery later if users ask for it.

**DEC-P002: Plants as friendship health visualization**
Each friendship is displayed as an SVG plant that grows or wilts based on days since last contact.
*Reason:* Plants communicate health instantly without numbers. They're emotional, memorable, and shareable ("my friend garden"). Completely unique in the social app space. No competitor does this.

**DEC-P003: Daily Question — uneditable after posting**
Once you submit your daily answer, it cannot be changed.
*Reason:* The edit button is the enemy of authenticity. When people know they can edit, they perform. When they know they can't, they say what they actually think. This is the core of the feature's value. It must never be changed.

**DEC-P004: Daily Question — gated answers**
You cannot see friends' answers until you post your own.
*Reason:* Creates a natural incentive to participate. If answers were visible before posting, people would read first and craft a response. Gating forces the authentic first-thought answer.

**DEC-P005: No photos in Daily Question**
Text only. No camera, no image picker.
*Reason:* Photo anxiety kills participation. "Does this look good enough?" is the enemy. Text is immediate and low-friction. The product is about what people think and feel, not what they look like.

**DEC-P006: Quests tied to registered venues only**
Buddi only suggests venues that have paid to be registered on the platform.
*Reason:* This creates a sustainable business model (venues pay for placement) while keeping the suggestion quality high (only vetted, willing venues are shown). It also creates a natural sales motion — venues see the value immediately.

**DEC-P007: Quests appear in two places**
Inside Friend Detail (friendship-specific) AND in a "Tonight" discovery tab (city-wide).
*Reason:* Friend Detail quests feel personal ("do this with Mira"). Tonight tab drives spontaneous discovery and increases session frequency. Both are needed.

**DEC-P008: "Miss You" — anonymous signal**
One tap sends a notification: "Someone is thinking of you" — without revealing who until the app is opened.
*Reason:* Sending a message after a long silence is high friction. A one-tap anonymous signal has near-zero friction. The mystery creates pull. The system auto-generates a quest to bridge the action gap.

**DEC-P009: Last contact tracked manually (v1)**
Users manually update "we just hung out" rather than tracking via GPS or check-in confirmation.
*Reason:* Automatic tracking requires location permissions and complex logic. For MVP, manual is sufficient and avoids privacy concerns. Can automate in v2 when venue check-ins are more established.

**DEC-P010: No premium subscription at launch**
Buddi launches free. No paywall.
*Reason:* Build the audience first, then monetize. A paywall in a cold-start product kills growth before you can prove value. Revenue in v1 comes entirely from venue registrations (B2B), not from users.

**DEC-P011: Name is Buddi**
"Bud" (a flower bud, the beginning of something growing) + "Buddy" (friend). Two meanings in one word.
Previous names considered: Kith, Fati, Loopi, Bloomi, Tend, Ember.
*Reason:* Simple, warm, immediately understood. Works internationally. Connects to the plant metaphor. Friendly without being childish.

**DEC-P012: Social feed added — supersedes DEC-P003/4/5 "no social feed" (2026-06-06)**
Buddi now has a friends' feed: users post text **statuses**, and friends can **like, repost, share by link, and share into a DM**. Direct messaging between friends is added. The Daily Question remains as-is (still uneditable/gated) — statuses are a separate, casual channel.
*Reason:* Product owner decision to make Buddi feel more social/fun. This intentionally reverses the earlier "not a social feed" stance (DEC-P003/4/5). Logged explicitly so the docs stay honest. Still text-first (no photo feed yet); no stranger-matching. If this proves to undermine the authenticity the Daily Question was protecting, revisit.

---

## Technical Decisions

**DEC-T001: Expo SDK 52 + React Native Web**
*Reason:* Developer cannot use Expo Go from work computer. The app must run in a browser via `npx expo start --web`. React Native Web enables this with one codebase. No need for a separate web build.

**DEC-T002: AsyncStorage instead of SecureStore**
*Chosen over:* expo-secure-store.
*Reason:* SecureStore does not work on web. AsyncStorage works on both mobile and web. Since web is the primary development environment, SecureStore is not an option. Tokens are stored in AsyncStorage on all platforms for consistency.

**DEC-T003: No ORM — raw pg queries**
*Chosen over:* Prisma, Drizzle, TypeORM.
*Reason:* Simple and transparent. SQL files are readable by anyone. No migration tooling to learn. Schema and seed data live as versioned `.sql` files in `Schema/` and `Dati/` — executed manually in Railway's SQL console. Three helpers (`query`, `queryOne`, `execute`) cover all cases.

**DEC-T004: Schema/Dati folder convention**
- `Schema/` — CREATE TABLE statements, versioned (1.1.0, 1.2.0…)
- `Dati/` — INSERT seed statements, same versioning
- New version folder for every schema change or new seed set
- Never edit old version folders
- All statements are safe to re-run

**DEC-T005: Node.js + Express backend**
*Chosen over:* Java Spring Boot, Next.js API routes, Supabase.
*Reason:* Fastest iteration speed for MVP. TypeScript across full stack means shared types. Can migrate to Spring Boot for specific services if scale requires it.

**DEC-T006: TanStack Query for server state**
*Chosen over:* Redux, Zustand for server state, SWR.
*Reason:* Server state and client state are different problems. TanStack Query handles caching, background refetch, loading/error states, and optimistic updates with minimal boilerplate.

**DEC-T007: Zustand for client state (auth only)**
*Reason:* Auth user is the only meaningful client state. Zustand is lightweight and simple. Everything else is server state managed by TanStack Query.

**DEC-T008: JWT with refresh tokens**
*Chosen over:* Supabase Auth, Firebase Auth, Clerk.
*Reason:* Full control, no third-party dependency. Access token expires in 15 minutes. Refresh token valid 30 days, stored in AsyncStorage, rotated on each use.

**DEC-T009: Expo Router v4**
*Chosen over:* React Navigation (manual).
*Reason:* File-based routing matches web mental model. Works with Expo Web out of the box (URL routing in browser). Better TypeScript support than manual navigation setup.

**DEC-T010: Upgraded Expo SDK 52 → 54 (2026-06-06)**
*Supersedes the SDK 52 pin in DEC-T001 and DEC-T009 (Expo Router v4 → v6).*
*Reason:* The current Expo Go on the App Store supports SDK 54–55 and refuses to open an SDK 52 project, so the phone could not run the app at all. Upgrading to SDK 54 (React 19, React Native 0.81, Expo Router v6) restores Expo Go compatibility. The upgrade was clean — no app code changes were needed; typecheck and the web bundle both pass on 54.

---

## Open Decisions

**OPEN-001: Daily question timing**
Random time (like BeReal) confirmed. But should there be a minimum gap between notifications? (e.g. not before 9am, not after 10pm local time?)
*Leaning toward:* Yes — respect quiet hours (9am–10pm).

**OPEN-002: Can you see past daily answers?**
Should users be able to scroll back through their own answer history? Through friends' histories?
*Leaning toward:* Yes for own history (visible on Profile). Friends' history — only mutual, opt-in.

**OPEN-003: How many quest suggestions per friendship?**
Currently: 2–3 cards inside Friend Detail. Is this the right number?
*Leaning toward:* 3 max. More creates paradox of choice.

**OPEN-004: Venue registration — web form or in-app?**
Currently spec'd as a web form (external). Should there be an in-app venue owner portal eventually?
*Leaning toward:* Web form for v1. In-app portal for v2 when venues > 50.

**OPEN-005: Should "Miss You" reveal the sender immediately?**
Currently: recipient sees who sent it when they open the app.
Alternative: only reveal after the recipient also taps "Miss You" back (double opt-in).
*Leaning toward:* Reveal immediately — the mystery is the hook, prolonging it creates anxiety.
