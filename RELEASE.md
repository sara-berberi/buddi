# Buddi — Release / TestFlight Checklist

This gets Buddi onto **TestFlight** (and later the App Store) with EAS Build.
Most of this needs **your** Apple credentials — the steps below are what you run.

---

## 0. Prerequisites (one-time)

- [ ] **Apple Developer Program** membership ($99/yr) — https://developer.apple.com/programs/
- [ ] **Expo account** — https://expo.dev (free)
- [ ] Install the EAS CLI:
  ```bash
  npm install -g eas-cli
  eas login
  ```

---

## 1. Link the project to EAS (one-time)

From the repo root:
```bash
eas init
```
This creates/links an EAS project and fills `extra.eas.projectId` in `app.json`
(currently the placeholder `REPLACE_WITH_EAS_PROJECT_ID`). Commit the change.

---

## 2. Fill in the submit credentials

Edit `eas.json` → `submit.production.ios`:

| Field | Where to find it |
|---|---|
| `appleId` | your Apple ID email |
| `appleTeamId` | developer.apple.com → Membership → Team ID |
| `ascAppId` | App Store Connect → your app → App Information → "Apple ID" (a number) |

You'll first need to **create the app record** in App Store Connect:
App Store Connect → Apps → **+** → New App
- Platform: iOS
- Bundle ID: **com.buddi.app** (must match `app.json`)
- SKU: `buddi`
- Name: Buddi

---

## 3. Build for TestFlight

```bash
eas build --platform ios --profile production
```
- First run: EAS offers to **generate your iOS credentials** (distribution cert +
  provisioning profile) — say yes, it manages them for you.
- Build runs in the cloud (~10–20 min). You get a download/he link when done.
- `production` profile uses `appVersionSource: remote` + `autoIncrement`, so EAS
  bumps the build number automatically each build.

> The app's API base URL is baked in at build time from `eas.json`
> (`EXPO_PUBLIC_API_URL = https://buddi-production.up.railway.app`). Make sure the
> backend is live (it is) before testers use the build.

---

## 4. Submit to TestFlight

```bash
eas submit --platform ios --profile production --latest
```
This uploads the latest build to App Store Connect. After Apple finishes
processing (~10–30 min), the build appears under **TestFlight**.

- Add yourself / testers under **TestFlight → Internal Testing** (no review needed
  for internal testers on your team).
- **External** testers require a short Beta App Review.

---

## 5. Going to the App Store (later)

In App Store Connect for the app:
- [ ] Screenshots (6.7" + 5.5" iPhone at minimum)
- [ ] App description, keywords, support URL, privacy policy URL
- [ ] **App Privacy** questionnaire (see data note below)
- [ ] Age rating
- [ ] Pick the build → Submit for Review

### App Privacy data note
Buddi collects: email, username, user-generated text (statuses, DMs, daily
answers), and an optional self-styled avatar. No location is collected from the
device (the "city" is a free-text field the user can hide). No third-party
trackers. Declare email + user content as "linked to identity," used for App
Functionality.

---

## 6. Before every build — quick gate

```bash
# frontend
npx tsc --noEmit
npx expo export --platform web   # smoke-bundles everything

# backend (already deployed via Railway on git push to main)
cd backend && npx tsc --noEmit
```

---

## Security TODO (still open)

- [ ] **Rotate the Railway Postgres password** — it was shared in chat during setup.
- [ ] Set `RESEND_API_KEY` + a verified `EMAIL_FROM` in Railway when you want real
      verification/reset emails (until then the backend logs the link to its console).

---

## Notes

- Android: the same flow works with `--platform android` (needs a Google Play
  Developer account, $25 one-time) — not required for iOS TestFlight.
- Push notifications are not yet configured; the app works without them.
