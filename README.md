# Klassan Welfare Trust — کلاسن ویلفیئر ٹرسٹ

Complete, production-oriented full-stack community platform: **React 18 + TypeScript + Vite** frontend, **Firebase Auth, Cloud Firestore, Firebase Storage, and Cloud Functions (v2, TypeScript)** backend.

> **Honest status:** Firebase is **not configured** in this repository. `.env.example` ships empty and `src/firebase/config.ts` throws a clear error at boot until real keys are added (see [Setup](#setup)). No database, auth, or deployment is claimed to be live. The hosted demo, if any, uses a clearly-labelled local stand-in only until Firebase keys are added. There are **no fake/sample member or family records** anywhere in the code — lists render empty states until real data is created through the real flows. No logo was supplied, so none was invented: see `public/logo-placeholder/README.txt`.

## Hierarchy (exactly as briefed — no extra roles)

| Role | Count | How they join |
|---|---|---|
| President | 1 | First-time secure registration only (below) |
| Super Admin | 4 | Single-use invite link from the President + President approval |
| Assistant | 1 per Super Admin | Single-use invite link, two-stage approval (Super Admin → President) |
| Local Member | Unlimited | Single-use invite link from President / Super Admin |
| Families / Widows / Needy / Sick | — | Records managed by President & Super Admins |

## Architecture

```
src/
  main.tsx  App.tsx            # router, language/dir (EN LTR / UR RTL)
  firebase/  config.ts auth.ts # env-guarded init; Functions wrappers only
  lib/       i18n.ts validation.ts invitations.ts
  services/  invitations, applications, families, votes, records, roles, storage
  hooks/     useAuth.ts useRole.ts
  components/ Layout, LanguageSwitcher, ProtectedRoute, InviteLinkCard,
              StatusBadge, ImageUpload (preview, 5 MB), ConfirmDialog, EmptyState
  pages/     PresidentRegister, Login, RegisterByInvite, PresidentDashboard,
              SuperAdminDashboard, AssistantDashboard, MemberDashboard,
              Members, MemberProfile, Families, FamilyForm, FamilyDetail,
              WidowForm, NeedyPeople, SickPeople, PendingApprovals, MyProfile
  styles/    tokens.css (deep green #0B5D3B, gold #C9A227) + main.css (mobile-first)
functions/src/index.ts         # ALL privileged logic (callables + auth trigger)
firestore.rules  storage.rules # deny-by-default; role never client-writable
docs/  SETUP_FIREBASE.md  DATA_MODEL.md  TESTING.md
```

## Key workflows

- **First President (secure):** `initializePresident` runs a Firestore transaction that fails if `system/bootstrap.presidentExists` is set — a second registration is impossible even by calling the Function directly. Frontend checks are not relied on. The oath agreement and the exact oath text are stored in `president/president`. The oath (verbatim):
  > "مجھے خوشی ہے کہ میں اپنی قوم کا ایک ذمہ دار باصلاحیت اور قابل اعتماد رکن بنا ہوں۔ قوم نے مل کر ایک ذمہ داری کا بہت بڑا بوجھ میرے کندھوں پر رکھا ہے میرے لیے بہت نہیں بلکہ فخر کی بات ہے۔ میں اپنی اس ڈیوٹی کو ایمانداری کے ساتھ نبھاؤں گا۔ جس مدت تک میں صدر ہوں جو کام میرے ذمے ہوگا جتنا ہو سکا اپنی قوم کی خدمت کروں گا۔ اپنا کام مکمل ایمانداری اور دیانتداری سے کروں گا اپنے باقی دوستوں کو بھی ساتھ لے کے چلوں گا۔"
- **Invitations:** random 32-byte token; only its SHA-256 hash is stored. Single-use — redemption marks the invite `used` inside a transaction. 7-day expiry. Caps enforced server-side: 4 Super Admins, 1 Assistant per Super Admin.
- **Assistant approval:** `pending_super_admin` → Super Admin approves → `pending_president` → President approves → `assistant`. Either rejection stops the flow.
- **Families:** dynamic sons (1–10), daughters (1–10), unlimited other members; adding a person never clears entered data. Submitted as one connected record with status `pending`; approval by President/Super Admin only.
- **Category voting:** doc id `{familyId}_{voterUid}` enforces one vote per Super Admin (rules + Function). Finalised only at **≥3 matching votes** (Upper / Middle / Third Class).
- **Sick people:** removal sets `active=false` on the sick record only — family and member records are separate documents and are untouched.
- **Dismissals:** `dismissUser` downgrades Super Admin/Assistant to `member`, keeps the profile, writes `role_history`, and deactivates the admin link.
- **Security:** deny-by-default rules; `private_identity` (CNIC + document URLs) readable only by self + President/Super Admin; CNIC docs under `private/{uid}/` in Storage (owner + admins only); CNIC duplicate check in Functions; image type/size validated client-side (5 MB) and in Storage rules; passwords never stored in Firestore.

## Setup

```bash
npm install
cp .env.example .env   # fill VITE_FIREBASE_* from Firebase Console > Project settings
npm run dev            # http://localhost:5173
```

Full Firebase project creation, deploy, and first-President steps: [`docs/SETUP_FIREBASE.md`](docs/SETUP_FIREBASE.md). Data model (all 17 collections): [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md). Testing checklist (Part 24): [`docs/TESTING.md`](docs/TESTING.md).

## Deploy

```bash
firebase deploy --only firestore:rules,storage
cd functions && npm install && npm run build && cd ..
firebase deploy --only functions
npm run build && firebase deploy --only hosting
```

## Language

Full EN + UR dictionaries in `src/lib/i18n.ts`; the switcher sets `dir="rtl"` and Noto Nastaliq Urdu for Urdu, LTR + Inter for English. All nav, buttons, forms, validation, statuses, and dialogs are translated.

## What is NOT done / needs the owner

1. Firebase project + `.env` keys (see above) — nothing is live until then.
2. The Trust's real logo (`public/klassan-logo.png`) and hero image — not supplied, not invented.
3. Live end-to-end test run against a real/emulator Firebase project (checklist in `docs/TESTING.md`); `tsc`/`vite build` have not been run in this environment because dependencies are not installed here — run `npm install && npm run build` after setup.
