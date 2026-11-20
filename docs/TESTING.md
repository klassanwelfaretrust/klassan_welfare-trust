# Testing Checklist (mirrors Part 24)

Run against the Firebase emulators or a staging project — never production
data. Tick each item; fix failures before calling the build complete.

## President
- [ ] First visit shows President Registration; oath text is verbatim; submit
      without ticking the oath is rejected.
- [ ] Valid registration creates the President, stores oath agreement, redirects to dashboard.
- [ ] A second President registration attempt fails (`already-exists`) — including
      a direct callable call bypassing the UI — and leaves no orphan Auth account.
- [ ] A failed applicant registration (e.g. email already in use) does NOT burn
      the invitation: the same link still works for a retry.
- [ ] President Dashboard loads; Create Link for Super Admin returns a link.

## Super Admin
- [ ] Valid invite link opens registration; invalid/expired/used link is rejected.
- [ ] Same link used twice: second attempt fails (single-use, transaction).
- [ ] President approves → role becomes `super_admin`; reject → stays pending, no role.
- [ ] Fifth Super Admin invite is refused once 4 are active — counting
      active + pending applications + unused invitations, not actives alone.

## Assistant
- [ ] Super Admin creates exactly one Assistant link; a second is refused.
- [ ] Assistant registers → `pending_super_admin`; Super Admin approves →
      `pending_president`; President approves → `assistant`.
- [ ] Super Admin rejects → never reaches President. President rejects → not an Assistant.
- [ ] Super Admin dismisses their Assistant → role becomes `member`, profile kept, Assistant permissions gone immediately.
- [ ] President dismisses a Super Admin → role becomes `member`, profile kept.
- [ ] Super Admin Dashboard shows the current Assistant (if any) and hides the
      Assistant-link button while one exists.

## Local Members
- [ ] President/Super Admin create member link; one registration only; profile
      appears in Members Directory and Home member list.
- [ ] Member application appears in Pending Approvals; President/Super Admin
      approves → role becomes `member`; reject → stays pending, no access.
- [ ] A `pending` user who signs in sees the waiting-for-approval message,
      not the dashboard, and cannot open Members/Families/Needy/Sick.
- [ ] Login: empty email/password is rejected before submit; Forgot password
      sends a reset email (enter email first) and shows a clear message.
- [ ] Super Admin removes a member → profile `active=false`, family records untouched.
- [ ] A member cannot open `/pending` or call `approveSuperAdmin` (permission-denied).

## Families
- [ ] Sons count 4 generates exactly 4 son groups; daughters 1–10 likewise;
      adding an "other member" never clears entered data.
- [ ] Changing the sons/daughters count keeps already-typed rows; a child row
      with an empty name cannot be submitted.
- [ ] Family + members are saved in one batch (no half-saved family).
- [ ] Submit → status `pending`, not listed as approved; approval → appears,
      head name is the title, detail shows all sons/daughters/others.
- [ ] Voting: each Super Admin votes once (second vote rejected); 2–2 or
      2–1–1 finalises nothing; 3 matching votes finalise that category.

## Other records
- [ ] Widow form is separate from Add Family; record appears in Pending
      Approvals; after approval it appears in the Families area widows list.
- [ ] Needy record persists (no auto-expiry).
- [ ] Sick record added; removal hides it from the active Sick list but the
      person's family record and member profile remain intact.

## General
- [ ] Language switcher: every nav/button/form/status changes EN ↔ UR; UR layout is RTL.
- [ ] Mobile (360px) and desktop layouts; forms usable one-handed.
- [ ] Invalid CNIC (`123`), bad email, short password, >5 MB or non-image file → clear errors, no submit.
- [ ] Offline/network error during submit → error message, no false success, no duplicate on retry.
- [ ] Firestore/Storage rules: unauthenticated read of `private_identity` or
      `private/{uid}/` files is denied; a member cannot write `role`.
