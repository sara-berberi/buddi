# Buddi — Product Specification
**Version:** 1.0  
**Status:** MVP  
**Last updated:** 2025

---

## 1. What is Buddi

Buddi is a friendship tracker. It helps people maintain the relationships they already have.

Adults lose touch with friends not because they stop caring, but because nothing reminds them to reach out. Life moves faster than intention. Buddi is the infrastructure that bridges that gap.

---

## 2. The Three Features

### 2.1 Garden

Every friendship is represented as a plant. The plant's health reflects how recently you've been in contact.

**Health states:**

| State | Days since contact | Visual |
|---|---|---|
| Flourishing | 0–7 | Tall, full leaves, small flower. Sways gently. |
| Good | 8–20 | Medium plant, healthy green. |
| Fading | 21–35 | Shorter, leaves yellowing. |
| Wilting | 36–55 | Small, drooping, amber. |
| Critical | 56+ | Tiny, mostly brown, barely alive. |

The Garden is the Friends tab. Opening it gives an instant read of your social health — no numbers needed. A wilting plant tells you everything.

**Alert banner:** when 1 or more friendships reach wilting or critical, a banner appears at the top of the Garden.

**Tap a plant → opens Friend Detail screen.**

---

### 2.2 Daily Question

Every day at a random time, Buddi sends a push notification with one question.

**Rules:**
- One question per day, same question for all users
- You have a window to answer (no hard time limit, but shown as "active today")
- Text only — no photos, no formatting
- **Cannot edit after posting** — this is intentional and permanent
- You cannot see friends' answers until you post your own
- After posting: all friends' answers are revealed, newest first
- Each answer shows: avatar, name, their answer, timestamp
- A small lock icon marks your own answer as uneditable

**Why uneditable:** removes performance anxiety. Forces authenticity. You post what you actually think, not what you want people to think.

**Questions are system-generated** and rotate daily. Examples:
- *"Last thing that genuinely made you laugh?"*
- *"What are you procrastinating on right now?"*
- *"One word for how this week feels?"*
- *"What did you not expect to enjoy but did?"*

---

### 2.3 Quests

Quests are activity and date ideas suggested at venues that have registered on the Buddi platform.

**Two entry points:**

**Inside Friend Detail:**
The system suggests 2–3 venue-based activities specific to that friendship. Based on: days since contact, time of day, and the venue's category.

**Tonight Tab (discovery):**
A dedicated tab showing all current quest ideas across registered venues in the user's city. Filterable by: All · Café · Food · Outdoor · Culture

**A quest card shows:**
- Venue name
- Neighborhood
- Type and price range
- A suggested time
- 2 discussion topics (auto-generated, not editable by venue)
- "Let's go" button / "Show another" button

**Venue registration:**
Venues pay a monthly fee to be listed on Buddi and appear in quest suggestions. They provide: name, type, neighborhood, price range, photos. Buddi controls the discussion topics and suggestion logic.

---

## 3. Screens

### Auth flow
1. **Splash** — app name, tagline, get started
2. **Onboarding** — 5 questions to build personality profile (used for future quest personalization)
3. **Register / Login**

### Main app (tabs)
4. **Daily** — today's question + friends' answers (tab 1)
5. **Garden** — plant grid (tab 2)
6. **Tonight** — quest discovery (tab 3, center button)
7. **Profile** — user info + past daily answers (tab 4)

### Sub-screens
8. **Friend Detail** — plant, stats, "miss you" button, quest suggestions, history
9. **Quest Detail** — full venue card + discussion topics + action buttons
10. **Add Friend** — invite by username or link

---

## 4. Core Mechanics

### 4.1 Following
- Users follow each other (mutual = friendship)
- No requirement to have met through Buddi first
- Can follow an existing friend of 10 years from day one
- Follow via: username search or invite link

### 4.2 Last Contact Tracking
- System asks: *"When did you last see [name]?"* after onboarding
- Updated manually via "We just hung out" button in Friend Detail
- Updated automatically when both users complete a quest at the same venue (future feature)
- `days_since_contact` drives plant health state

### 4.3 "Miss You" Signal
- Single tap in Friend Detail
- Sends anonymous push notification: *"Someone is thinking of you"*
- Recipient sees who it was when they open the app
- System auto-generates a quest suggestion for the two of them

### 4.4 Quest Generation (v1 — simple)
- Pull registered venues from database filtered by user's city
- Weight by: recency (haven't suggested this venue recently), type variety, time of day
- Attach 2 discussion topics from a pre-written pool matched to venue type
- No ML — deterministic weighted selection

---

## 5. Venue Registration (B2B)

Venues register through a web form (not in-app). Buddi reviews and approves.

**What venues provide:**
- Name, address, neighborhood, type, price range
- Opening hours
- Up to 3 photos

**What Buddi controls:**
- Whether and when the venue appears in suggestions
- Discussion topics shown with the venue
- Ranking in tonight's discovery tab

**Pricing (initial):**
- Basic listing: 3,000–5,000 ALL/month
- Featured placement: 8,000–15,000 ALL/month

---

## 6. Technical Requirements

### 6.1 Frontend
- Expo SDK 54, React Native Web enabled
- Must run on `npx expo start --web` (primary dev environment)
- AsyncStorage for token storage (SecureStore breaks on web)
- react-native-svg for plants
- Expo Router v6 for navigation

### 6.2 Backend
- Express + raw pg queries
- No ORM
- PostgreSQL on Railway
- JWT auth (access + refresh)

### 6.3 Database
- Schema versioned in `Schema/` folder
- Seed data in `Dati/` folder
- Developer runs SQL manually in Railway console

---

## 7. Notifications

| Trigger | Message | Platform |
|---|---|---|
| Daily question published | "Today's question is live — answer first 🌱" | Mobile only |
| Plant wilting (36 days) | "[Name]'s plant is wilting. Time for a quest?" | Mobile only |
| Plant critical (56 days) | "You haven't seen [Name] in [N] days." | Mobile only |
| Miss you received | "Someone is thinking of you 💭" | Mobile only |
| Quest confirmed by friend | "[Name] is in for [venue] tonight" | Mobile only |

Web: no push notifications. Show in-app badge on tab bar only.

---

## 8. Success Metrics

**North star:** Daily Question answer rate (% of active users who answer each day)

| Metric | Month 1 target | Month 3 target |
|---|---|---|
| Registered users | 200 | 1,000 |
| Daily question answer rate | 40% | 55% |
| Quests completed / week | 20 | 150 |
| Venues registered | 5 | 25 |
| D30 retention | 35% | 45% |

---

## 9. Out of Scope (MVP)

- Matching / meeting strangers
- Public social feed with photos
- Synchronized experiences (film, recipe)
- Kith Nights / group events
- Premium subscription (build audience first)
- B2B Teams product
- Multi-city expansion
