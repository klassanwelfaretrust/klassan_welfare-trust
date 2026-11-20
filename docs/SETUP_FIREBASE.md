# Firebase Setup — Klassan Welfare Trust

> Honest status: Firebase is **not configured** in this repo. `.env.example`
> ships empty and `src/firebase/config.ts` throws a clear error until you add
> keys. Nothing here pretends to be live until you complete these steps.

## 1. Create the project
1. Go to https://console.firebase.google.com → Add project → name it `klassan-welfare-trust`.
2. Enable **Authentication → Sign-in method → Email/Password**.
3. Create a **Cloud Firestore** database (production mode, region closest to users, e.g. `asia-south1`).
4. Enable **Storage** (same project).
5. Upgrade to the **Blaze (pay-as-you-go)** plan — required for Cloud Functions
   (v2) outbound calls; the free tier cannot run them.
6. Register a **Web app** (</> icon) and copy the config values.

## 2. Local environment
```bash
npm install
cp .env.example .env
# fill VITE_FIREBASE_* from the Web app config
npm run dev   # http://localhost:5173
```

## 3. Deploy rules, functions, hosting
```bash
npm install -g firebase-tools
firebase login
firebase use --add   # select your project
firebase deploy --only firestore:rules,storage
cd functions && npm install && npm run build && cd ..
firebase deploy --only functions
npm run build && firebase deploy --only hosting
```

## 4. First President (secure initialisation)
- Open the site → **President Registration**. Only the first registration
  succeeds: `initializePresident` runs a Firestore transaction that fails if
  `system/bootstrap.presidentExists` is already set. There is no frontend-only
  guard — a second attempt is rejected server-side (`already-exists`).
- The oath agreement + exact oath text are stored in `president/president`.
- After that, the President signs in and creates Super Admin invite links
  from the President Dashboard. Nobody can self-register as President again.

## 5. Emulator (optional, for testing without a live project)
```bash
firebase emulators:start --only auth,firestore,storage,functions
```
Point the app at the emulators per Firebase docs before running the
checklist in `docs/TESTING.md`.
