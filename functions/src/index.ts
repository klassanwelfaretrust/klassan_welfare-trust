/**
 * Klassan Welfare Trust — Cloud Functions (trusted backend).
 * Every privileged operation lives here. Clients NEVER write role, status,
 * approval or invitation-used fields directly (firestore.rules forbids it).
 * Deploy: `firebase deploy --only functions` (see docs/SETUP_FIREBASE.md).
 */
import * as admin from 'firebase-admin';
import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { randomBytes, createHash } from 'crypto';

admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();
const now = () => admin.firestore.FieldValue.serverTimestamp();
const CNIC_RE = /^\d{5}-\d{7}-\d$/;

type Role = 'president' | 'super_admin' | 'assistant' | 'member' | 'pending';
interface Ctx { uid?: string; role?: Role; }

async function caller(req: CallableRequest): Promise<Ctx> {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Sign in required.');
  const snap = await db.doc(`users/${req.auth.uid}`).get();
  return { uid: req.auth.uid, role: snap.data()?.role as Role };
}
function needRole(ctx: Ctx, roles: Role[]) {
  if (!ctx.uid || !ctx.role || !roles.includes(ctx.role))
    throw new HttpsError('permission-denied', `Requires role: ${roles.join(' or ')}.`);
}
async function assertCnicUnique(cnic: string, excludeUid?: string) {
  if (!CNIC_RE.test(cnic)) throw new HttpsError('invalid-argument', 'CNIC must be 35202-1234567-1 format.');
  const q = await db.collection('private_identity').where('cnic', '==', cnic).limit(2).get();
  if (q.docs.some((d) => d.id !== excludeUid))
    throw new HttpsError('already-exists', 'This CNIC is already registered.');
}
async function logApproval(kind: string, targetId: string, byUid: string, decision: string, note = '') {
  await db.collection('approval_records').add({ kind, targetId, byUid, decision, note, createdAt: now() });
}
async function logRole(uid: string, from: Role | null, to: Role, byUid: string, reason: string) {
  await db.collection('role_history').add({ uid, fromRole: from, toRole: to, changedBy: byUid, reason, createdAt: now() });
}

/** 1. FIRST-TIME PRESIDENT — the ONLY way a president is created.
 *  The Auth account is created FIRST, outside the transaction (H6): creating
 *  it inside the transaction meant a transaction retry failed with
 *  "email already exists" and could leave an orphan account. If the
 *  transaction below then fails (a President already exists), the
 *  just-created Auth user is deleted again so no orphan remains.
 *  Transaction: fails if system/bootstrap.presidentExists OR any president
 *  doc already exists. No frontend check can bypass this. */
export const initializePresident = onCall(async (req) => {
  const d = req.data as { email: string; password: string; fullName: string; cnic: string; fatherName: string; address: string; occupation: string; oathAgreed: boolean };
  if (!d.oathAgreed) throw new HttpsError('failed-precondition', 'The President must agree to the oath.');
  if (!d.email || !d.password || d.password.length < 8) throw new HttpsError('invalid-argument', 'Email and a password of at least 8 characters are required.');
  if (!d.fullName || !d.fatherName || !d.address || !d.occupation) throw new HttpsError('invalid-argument', 'All registration fields are required.');
  await assertCnicUnique(d.cnic);
  const ref = db.doc('system/bootstrap');
  const bootPre = await ref.get();
  if (bootPre.exists && bootPre.data()?.presidentExists) throw new HttpsError('already-exists', 'A President is already registered. Second registration is blocked.');
  let user: admin.auth.UserRecord;
  try { user = await auth.createUser({ email: d.email, password: d.password, displayName: d.fullName }); }
  catch (e: any) { throw new HttpsError('already-exists', e?.message ?? 'Could not create auth user.'); }
  try {
    await db.runTransaction(async (tx) => {
      const boot = await tx.get(ref);
      if (boot.exists && boot.data()?.presidentExists) throw new HttpsError('already-exists', 'A President is already registered. Second registration is blocked.');
      const existing = await tx.get(db.collection('president').limit(1));
      if (!existing.empty) throw new HttpsError('already-exists', 'A President is already registered.');
      tx.set(db.doc(`users/${user.uid}`), { uid: user.uid, fullName: d.fullName, role: 'president', email: d.email, createdAt: now() });
      tx.set(db.doc(`member_profiles/${user.uid}`), { uid: user.uid, fullName: d.fullName, fatherName: d.fatherName, address: d.address, occupation: d.occupation, role: 'president', active: true, createdAt: now() });
      tx.set(db.doc(`private_identity/${user.uid}`), { uid: user.uid, cnic: d.cnic, createdAt: now() });
      tx.set(db.doc('president/president'), { uid: user.uid, fullName: d.fullName, cnic: d.cnic, fatherName: d.fatherName, address: d.address, occupation: d.occupation, oathAgreed: true, oathText: 'مجھے خوشی ہے کہ میں اپنی قوم کا ایک ذمہ دار باصلاحیت اور قابل اعتماد رکن بنا ہوں۔ قوم نے مل کر ایک ذمہ داری کا بہت بڑا بوجھ میرے کندھوں پر رکھا ہے میرے لیے بہت نہیں بلکہ فخر کی بات ہے۔ میں اپنی اس ڈیوٹی کو ایمانداری کے ساتھ نبھاؤں گا۔ جس مدت تک میں صدر ہوں جو کام میرے ذمے ہوگا جتنا ہو سکا اپنی قوم کی خدمت کروں گا۔ اپنا کام مکمل ایمانداری اور دیانتداری سے کروں گا اپنے باقی دوستوں کو بھی ساتھ لے کے چلوں گا۔', oathAgreedAt: now(), createdAt: now() });
      tx.set(ref, { presidentExists: true, presidentUid: user.uid, createdAt: now() }, { merge: true });
    });
  } catch (e) {
    // Transaction failed after the account was created — delete it so a
    // retry does not hit "email already exists" and no orphan account stays.
    try { await auth.deleteUser(user.uid); } catch { /* already gone */ }
    throw e;
  }
  await logRole(user.uid, null, 'president', user.uid, 'First-time president initialisation');
  return { ok: true, uid: user.uid };
});

/** 2. CREATE INVITATION — President (super_admin/member) or Super Admin (assistant/member).
 *  Enforces: max 4 super admins, max 1 assistant per super admin, one token
 *  per invite, 7-day expiry. Token is random 32 bytes; only its SHA-256 hash
 *  is stored — the raw token appears once, in the link given to the creator. */
export const createInvitation = onCall(async (req) => {
  const ctx = await caller(req);
  const { forRole, superAdminUid } = req.data as { forRole: 'super_admin' | 'assistant' | 'member'; superAdminUid?: string };
  if (forRole === 'super_admin') needRole(ctx, ['president']);
  else needRole(ctx, ['president', 'super_admin']);
  if (forRole === 'super_admin') {
    // M6: count ACTIVE Super Admins + PENDING applications + UNUSED (active,
    // unexpired) Super Admin invites — counting actives only let a 5th invite
    // be created whose approval would then fail.
    const [active, pendingApps, openInvites] = await Promise.all([
      db.collection('super_admins').where('active', '==', true).get(),
      db.collection('super_admin_applications').where('status', '==', 'pending').get(),
      db.collection('registration_invitations').where('forRole', '==', 'super_admin').where('status', '==', 'active').get(),
    ]);
    const liveInvites = openInvites.docs.filter((d) => (d.data().expiresAt?.toMillis?.() ?? 0) > Date.now()).length;
    if (active.size + pendingApps.size + liveInvites >= 4) throw new HttpsError('failed-precondition', 'All four Super Admin positions are filled (including pending applications and unused invitations).');
  }
  if (forRole === 'assistant') {
    const owner = superAdminUid ?? ctx.uid!;
    if (ctx.role === 'super_admin' && owner !== ctx.uid) throw new HttpsError('permission-denied', 'A Super Admin can only invite their own Assistant.');
    const existing = await db.collection('assistant_admins').where('superAdminUid', '==', owner).where('active', '==', true).get();
    if (!existing.empty) throw new HttpsError('failed-precondition', 'This Super Admin already has an Assistant.');
    const open = await db.collection('registration_invitations').where('forRole', '==', 'assistant').where('superAdminUid', '==', owner).where('status', '==', 'active').get();
    if (!open.empty) throw new HttpsError('failed-precondition', 'An unused Assistant invitation already exists for this Super Admin.');
  }
  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const ref = await db.collection('registration_invitations').add({ tokenHash, forRole, superAdminUid: superAdminUid ?? ctx.uid ?? null, createdBy: ctx.uid, status: 'active', expiresAt, usedBy: null, usedAt: null, createdAt: now() });
  return { ok: true, invitationId: ref.id, token, url: `/register/${ref.id}?token=${token}`, expiresAt: expiresAt.toDate().toISOString() };
});

/** 3. REDEEM INVITATION — validates token exactly once, in a transaction.
 *  Wrong/expired/used token => error. Success marks it used atomically, so
 *  two simultaneous redemptions cannot both succeed. */
export const redeemInvitation = onCall(async (req) => {
  const { invitationId, token } = req.data as { invitationId: string; token: string };
  if (!invitationId || !token) throw new HttpsError('invalid-argument', 'Invitation id and token are required.');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const ref = db.doc(`registration_invitations/${invitationId}`);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpsError('not-found', 'Invitation not found.');
    const inv = snap.data()!;
    if (inv.tokenHash !== tokenHash) throw new HttpsError('permission-denied', 'Invalid invitation token.');
    if (inv.status !== 'active') throw new HttpsError('failed-precondition', 'This invitation has already been used or expired.');
    if (inv.expiresAt.toMillis() < Date.now()) { tx.update(ref, { status: 'expired' }); throw new HttpsError('failed-precondition', 'This invitation has expired. Ask for a new link.'); }
    tx.update(ref, { status: 'used', usedAt: now() });
    return { ok: true, forRole: inv.forRole, superAdminUid: inv.superAdminUid ?? null };
  });
});

/** 3a. CHECK INVITATION — read-only validation for the registration page.
 *  Returns the role the invite is for WITHOUT marking it used, so the page
 *  can show the form. The single redemption still happens exactly once,
 *  inside registerApplicant when the form is submitted. */
export const checkInvitation = onCall(async (req) => {
  const { invitationId, token } = req.data as { invitationId: string; token: string };
  if (!invitationId || !token) throw new HttpsError('invalid-argument', 'Invitation id and token are required.');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const snap = await db.doc(`registration_invitations/${invitationId}`).get();
  if (!snap.exists) throw new HttpsError('not-found', 'Invitation not found.');
  const inv = snap.data()!;
  if (inv.tokenHash !== tokenHash) throw new HttpsError('permission-denied', 'Invalid invitation token.');
  if (inv.status !== 'active') throw new HttpsError('failed-precondition', 'This invitation has already been used or expired.');
  if (inv.expiresAt.toMillis() < Date.now()) throw new HttpsError('failed-precondition', 'This invitation has expired. Ask for a new link.');
  return { ok: true, forRole: inv.forRole, superAdminUid: inv.superAdminUid ?? null };
});

/** Shared applicant registration (after redeem): creates auth user + pending
 *  application. Approval functions below activate the role.
 *  H7: the invitation is marked used ONLY AFTER the account is created
 *  successfully. Order: (1) validate the invitation read-only, (2) create
 *  the Auth user + records, (3) mark the invitation used in a transaction
 *  that re-checks it is still active. If step (3) fails (e.g. a second
 *  registration redeemed it first), the just-created user and records are
 *  deleted again so nothing orphaned remains. */
export const registerApplicant = onCall(async (req) => {
  const d = req.data as { invitationId: string; token: string; email: string; password: string; fullName: string; fatherName: string; cnic: string; address: string; skills: string; occupation: string; cnicFrontUrl: string; cnicBackUrl: string; photoUrl: string };
  if (!d.invitationId || !d.token) throw new HttpsError('invalid-argument', 'Invitation id and token are required.');
  // (1) Validate only — do NOT mark used yet.
  const invRef = db.doc(`registration_invitations/${d.invitationId}`);
  const invSnap = await invRef.get();
  if (!invSnap.exists) throw new HttpsError('not-found', 'Invitation not found.');
  const inv = invSnap.data()!;
  if (inv.tokenHash !== createHash('sha256').update(d.token).digest('hex')) throw new HttpsError('permission-denied', 'Invalid invitation token.');
  if (inv.status !== 'active') throw new HttpsError('failed-precondition', 'This invitation has already been used or expired.');
  if (inv.expiresAt.toMillis() < Date.now()) { await invRef.update({ status: 'expired' }); throw new HttpsError('failed-precondition', 'This invitation has expired.'); }
  const forRole = inv.forRole as 'super_admin' | 'assistant' | 'member';
  const superAdminUid = (inv.superAdminUid ?? null) as string | null;
  if (!d.email || !d.password || d.password.length < 8) throw new HttpsError('invalid-argument', 'Email and password (8+ chars) required.');
  await assertCnicUnique(d.cnic);
  // (2) Create the account and its records first.
  const user = await auth.createUser({ email: d.email, password: d.password, displayName: d.fullName });
  const coll = forRole === 'super_admin' ? 'super_admin_applications' : forRole === 'assistant' ? 'assistant_applications' : 'member_applications';
  const appRef = db.collection(coll).doc();
  const batch = db.batch();
  batch.set(db.doc(`users/${user.uid}`), { uid: user.uid, fullName: d.fullName, role: 'pending', email: d.email, createdAt: now() });
  batch.set(db.doc(`member_profiles/${user.uid}`), { uid: user.uid, fullName: d.fullName, fatherName: d.fatherName, address: d.address, skills: d.skills, occupation: d.occupation, photoUrl: d.photoUrl ?? null, role: 'pending', active: true, createdAt: now() });
  batch.set(db.doc(`private_identity/${user.uid}`), { uid: user.uid, cnic: d.cnic, cnicFrontUrl: d.cnicFrontUrl ?? null, cnicBackUrl: d.cnicBackUrl ?? null, createdAt: now() });
  // Copy superAdminUid from the invitation onto the application: the Super
  // Admin's pending list filters by this field, so without it an Assistant
  // application could never be found or approved (Stage 1).
  batch.set(appRef, { applicantUid: user.uid, invitationId: d.invitationId, fullName: d.fullName, superAdminUid, status: coll === 'assistant_applications' ? 'pending_super_admin' : 'pending', createdAt: now() });
  await batch.commit();
  // (3) Mark the invitation used exactly once, re-checking it is still active.
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(invRef);
      if (!snap.exists || snap.data()!.status !== 'active') throw new HttpsError('failed-precondition', 'This invitation has already been used or expired.');
      if (snap.data()!.tokenHash !== createHash('sha256').update(d.token).digest('hex')) throw new HttpsError('permission-denied', 'Invalid invitation token.');
      tx.update(invRef, { status: 'used', usedAt: now(), usedBy: d.email });
    });
  } catch (e) {
    // Invitation was taken in the meantime — roll the new account back.
    const cleanup = db.batch();
    cleanup.delete(db.doc(`users/${user.uid}`)); cleanup.delete(db.doc(`member_profiles/${user.uid}`));
    cleanup.delete(db.doc(`private_identity/${user.uid}`)); cleanup.delete(appRef);
    await cleanup.commit().catch(() => {});
    await auth.deleteUser(user.uid).catch(() => {});
    throw e;
  }
  return { ok: true, uid: user.uid };
});

/** 3b. COMPLETE APPLICANT DOCUMENTS — after the applicant signs in with
 *  the account registerApplicant created, the client uploads CNIC/photo to
 *  Storage under its own uid (rules allow owner-only writes) and then calls
 *  this to attach the URLs to the private record. No role/status is set here. */
export const completeApplicantDocuments = onCall(async (req) => {
  const ctx = await caller(req);
  const { cnicFrontUrl, cnicBackUrl, photoUrl } = req.data as { cnicFrontUrl: string; cnicBackUrl: string; photoUrl: string };
  if (!cnicFrontUrl || !cnicBackUrl || !photoUrl) throw new HttpsError('invalid-argument', 'All three document URLs are required.');
  await db.doc(`private_identity/${ctx.uid}`).update({ cnicFrontUrl, cnicBackUrl });
  await db.doc(`member_profiles/${ctx.uid}`).update({ photoUrl });
  return { ok: true };
});

/** 4. APPROVE SUPER ADMIN — President only; enforces the 4-seat cap. */
export const approveSuperAdmin = onCall(async (req) => {
  const ctx = await caller(req); needRole(ctx, ['president']);
  const { applicationId, approve, reason } = req.data as { applicationId: string; approve: boolean; reason?: string };
  const appRef = db.doc(`super_admin_applications/${applicationId}`);
  const app = (await appRef.get()).data(); if (!app) throw new HttpsError('not-found', 'Application not found.');
  if (app.status !== 'pending') throw new HttpsError('failed-precondition', 'Application already decided.');
  if (approve) {
    const count = (await db.collection('super_admins').where('active', '==', true).get()).size;
    if (count >= 4) throw new HttpsError('failed-precondition', 'All four Super Admin positions are filled.');
    await db.runTransaction(async (tx) => {
      tx.update(appRef, { status: 'approved', decidedBy: ctx.uid, decidedAt: now() });
      tx.set(db.doc(`super_admins/${app.applicantUid}`), { uid: app.applicantUid, fullName: app.fullName, active: true, approvedBy: ctx.uid, createdAt: now() });
      tx.update(db.doc(`users/${app.applicantUid}`), { role: 'super_admin' });
      tx.update(db.doc(`member_profiles/${app.applicantUid}`), { role: 'super_admin' });
    });
    await logApproval('super_admin', applicationId, ctx.uid!, 'approved'); await logRole(app.applicantUid, 'pending', 'super_admin', ctx.uid!, 'President approval');
  } else {
    await appRef.update({ status: 'rejected', decidedBy: ctx.uid, decidedAt: now(), reason: reason ?? '' });
    await logApproval('super_admin', applicationId, ctx.uid!, 'rejected', reason ?? '');
  }
  return { ok: true, approved: approve };
});

/** 5. ASSISTANT — Stage 1 (Super Admin) then Stage 2 (President). */
export const approveAssistantStage1 = onCall(async (req) => {
  const ctx = await caller(req); needRole(ctx, ['super_admin']);
  const { applicationId, approve, reason } = req.data as { applicationId: string; approve: boolean; reason?: string };
  const ref = db.doc(`assistant_applications/${applicationId}`);
  const app = (await ref.get()).data(); if (!app) throw new HttpsError('not-found', 'Application not found.');
  if (app.superAdminUid && app.superAdminUid !== ctx.uid) throw new HttpsError('permission-denied', 'Only the relevant Super Admin reviews this application.');
  if (app.status !== 'pending_super_admin') throw new HttpsError('failed-precondition', 'Application is not awaiting Super Admin review.');
  await ref.update({ status: approve ? 'pending_president' : 'rejected', decidedByStage1: ctx.uid, decidedAtStage1: now(), reason: reason ?? '' });
  await logApproval('assistant_stage1', applicationId, ctx.uid!, approve ? 'approved' : 'rejected', reason ?? '');
  return { ok: true, approved: approve };
});
export const approveAssistantStage2 = onCall(async (req) => {
  const ctx = await caller(req); needRole(ctx, ['president']);
  const { applicationId, approve, reason } = req.data as { applicationId: string; approve: boolean; reason?: string };
  const ref = db.doc(`assistant_applications/${applicationId}`);
  const app = (await ref.get()).data(); if (!app) throw new HttpsError('not-found', 'Application not found.');
  if (app.status !== 'pending_president') throw new HttpsError('failed-precondition', 'Application is not awaiting President review.');
  if (approve) {
    await db.runTransaction(async (tx) => {
      tx.update(ref, { status: 'approved', decidedBy: ctx.uid, decidedAt: now() });
      tx.set(db.doc(`assistant_admins/${app.applicantUid}`), { uid: app.applicantUid, superAdminUid: app.superAdminUid ?? null, fullName: app.fullName, active: true, createdAt: now() });
      tx.update(db.doc(`users/${app.applicantUid}`), { role: 'assistant' });
      tx.update(db.doc(`member_profiles/${app.applicantUid}`), { role: 'assistant' });
    });
    await logRole(app.applicantUid, 'pending', 'assistant', ctx.uid!, 'President final approval');
  } else { await ref.update({ status: 'rejected', decidedBy: ctx.uid, decidedAt: now(), reason: reason ?? '' }); }
  await logApproval('assistant_stage2', applicationId, ctx.uid!, approve ? 'approved' : 'rejected', reason ?? '');
  return { ok: true, approved: approve };
});

/** 5a. APPROVE MEMBER (C5) — President or Super Admin. Until this runs, a
 *  Local Member stays role 'pending' and ProtectedRoute keeps them out of
 *  the internal pages. Rejecting leaves them pending-role with no access;
 *  their profile is kept either way. */
export const approveMember = onCall(async (req) => {
  const ctx = await caller(req); needRole(ctx, ['president', 'super_admin']);
  const { applicationId, approve, reason } = req.data as { applicationId: string; approve: boolean; reason?: string };
  const appRef = db.doc(`member_applications/${applicationId}`);
  const app = (await appRef.get()).data(); if (!app) throw new HttpsError('not-found', 'Application not found.');
  if (app.status !== 'pending') throw new HttpsError('failed-precondition', 'Application already decided.');
  if (approve) {
    await db.runTransaction(async (tx) => {
      tx.update(appRef, { status: 'approved', decidedBy: ctx.uid, decidedAt: now() });
      tx.update(db.doc(`users/${app.applicantUid}`), { role: 'member' });
      tx.update(db.doc(`member_profiles/${app.applicantUid}`), { role: 'member' });
    });
    await logApproval('member', applicationId, ctx.uid!, 'approved'); await logRole(app.applicantUid, 'pending', 'member', ctx.uid!, 'Member approval');
  } else {
    await appRef.update({ status: 'rejected', decidedBy: ctx.uid, decidedAt: now(), reason: reason ?? '' });
    await logApproval('member', applicationId, ctx.uid!, 'rejected', reason ?? '');
  }
  return { ok: true, approved: approve };
});

/** 5b. APPROVE WIDOW (H3) — President or Super Admin. Widow records are
 *  submitted as 'pending' by addWidow and only appear in the Families area
 *  once approved here. The record itself is never merged with Add Family. */
export const approveWidow = onCall(async (req) => {
  const ctx = await caller(req); needRole(ctx, ['president', 'super_admin']);
  const { widowId, approve, reason } = req.data as { widowId: string; approve: boolean; reason?: string };
  const ref = db.doc(`widow_records/${widowId}`);
  const rec = (await ref.get()).data(); if (!rec) throw new HttpsError('not-found', 'Widow record not found.');
  if (rec.status !== 'pending') throw new HttpsError('failed-precondition', 'Widow record already decided.');
  await ref.update({ status: approve ? 'approved' : 'rejected', decidedBy: ctx.uid, decidedAt: now(), reason: reason ?? '' });
  await logApproval('widow', widowId, ctx.uid!, approve ? 'approved' : 'rejected', reason ?? '');
  return { ok: true, approved: approve };
});

/** 6. FAMILY APPROVAL — President or Super Admin, after verifying the family exists. */
export const approveFamily = onCall(async (req) => {
  const ctx = await caller(req); needRole(ctx, ['president', 'super_admin']);
  const { familyId, approve, reason } = req.data as { familyId: string; approve: boolean; reason?: string };
  const ref = db.doc(`families/${familyId}`);
  const fam = (await ref.get()).data(); if (!fam) throw new HttpsError('not-found', 'Family not found.');
  if (fam.status !== 'pending') throw new HttpsError('failed-precondition', 'Family already decided.');
  await ref.update({ status: approve ? 'approved' : 'rejected', decidedBy: ctx.uid, decidedAt: now(), reason: reason ?? '' });
  await logApproval('family', familyId, ctx.uid!, approve ? 'approved' : 'rejected', reason ?? '');
  return { ok: true, approved: approve };
});

/** 7. FAMILY CATEGORY VOTE — one vote per Super Admin per family.
 *  Finalises only when >=3 votes agree; otherwise stays open. */
export const submitFamilyVote = onCall(async (req) => {
  const ctx = await caller(req); needRole(ctx, ['super_admin']);
  const { familyId, category } = req.data as { familyId: string; category: 'upper' | 'middle' | 'third' };
  if (!['upper', 'middle', 'third'].includes(category)) throw new HttpsError('invalid-argument', 'Category must be upper, middle or third.');
  const fam = (await db.doc(`families/${familyId}`).get()).data();
  if (!fam || fam.status !== 'approved') throw new HttpsError('failed-precondition', 'Only approved families can be categorised.');
  const voteId = `${familyId}_${ctx.uid}`;
  const voteRef = db.doc(`family_category_votes/${voteId}`);
  const result = await db.runTransaction(async (tx) => {
    if ((await tx.get(voteRef)).exists) throw new HttpsError('already-exists', 'You have already voted for this family.');
    tx.set(voteRef, { familyId, voterUid: ctx.uid, category, createdAt: now() });
    const votes = await tx.get(db.collection('family_category_votes').where('familyId', '==', familyId));
    const counts: Record<string, number> = { upper: 0, middle: 0, third: 0 };
    votes.docs.forEach((d) => { counts[d.data().category] = (counts[d.data().category] ?? 0) + 1; });
    counts[category] += 1; // include this vote (query ran before set is visible in tx)
    const winner = (Object.keys(counts) as Array<keyof typeof counts>).find((k) => counts[k] >= 3);
    if (winner) tx.set(db.doc(`family_categories/${familyId}`), { familyId, category: winner, votes: counts, finalisedAt: now(), finalisedBy: 'system-3-of-4' });
    return { counts, finalised: winner ?? null };
  });
  return { ok: true, ...result };
});

/** 8. DISMISS — downgrade to Local Member, KEEP the profile + history. */
export const dismissUser = onCall(async (req) => {
  const ctx = await caller(req);
  const { targetUid, reason } = req.data as { targetUid: string; reason?: string };
  const target = (await db.doc(`users/${targetUid}`).get()).data();
  if (!target) throw new HttpsError('not-found', 'User not found.');
  if (target.role === 'super_admin') { needRole(ctx, ['president']); }
  else if (target.role === 'assistant') {
    needRole(ctx, ['president', 'super_admin']);
    if (ctx.role === 'super_admin') {
      const link = (await db.doc(`assistant_admins/${targetUid}`).get()).data();
      if (link?.superAdminUid !== ctx.uid) throw new HttpsError('permission-denied', 'A Super Admin can only dismiss their own Assistant.');
    }
  } else throw new HttpsError('failed-precondition', 'Only Super Admins and Assistants can be dismissed.');
  await db.runTransaction(async (tx) => {
    tx.update(db.doc(`users/${targetUid}`), { role: 'member' });
    tx.update(db.doc(`member_profiles/${targetUid}`), { role: 'member' });
    if (target.role === 'super_admin') tx.update(db.doc(`super_admins/${targetUid}`), { active: false, dismissedAt: now() });
    if (target.role === 'assistant') tx.update(db.doc(`assistant_admins/${targetUid}`), { active: false, dismissedAt: now() });
  });
  await logRole(targetUid, target.role, 'member', ctx.uid!, reason ?? 'Dismissed');
  return { ok: true, newRole: 'member' };
});

/** 9. REMOVE SICK PERSON — deactivates ONLY the sick record. Family and
 *  member records are untouched (separate collections, separate docs). */
export const removeSickPerson = onCall(async (req) => {
  const ctx = await caller(req); needRole(ctx, ['president', 'super_admin']);
  const { sickId, reason } = req.data as { sickId: string; reason?: string };
  const ref = db.doc(`sick_people/${sickId}`);
  const rec = (await ref.get()).data(); if (!rec) throw new HttpsError('not-found', 'Sick record not found.');
  await ref.update({ active: false, removedBy: ctx.uid, removedAt: now(), removalReason: reason ?? 'Recovered' });
  await logApproval('sick_removal', sickId, ctx.uid!, 'removed', reason ?? '');
  return { ok: true };
});

/** 10. REMOVE MEMBER (soft-delete) — Super Admin only; family records kept. */
export const removeMember = onCall(async (req) => {
  const ctx = await caller(req); needRole(ctx, ['president', 'super_admin']);
  const { targetUid, reason } = req.data as { targetUid: string; reason?: string };
  const target = (await db.doc(`users/${targetUid}`).get()).data();
  if (!target || target.role !== 'member') throw new HttpsError('failed-precondition', 'Only Local Members can be removed this way.');
  await db.doc(`member_profiles/${targetUid}`).update({ active: false, removedBy: ctx.uid, removedAt: now(), removalReason: reason ?? '' });
  await logRole(targetUid, 'member', 'member', ctx.uid!, `Removed from active members: ${reason ?? ''}`);
  return { ok: true };
});

/** Fires when a `users/{uid}` document is created (a Firestore document
 *  trigger, not an Auth trigger). It only fills in the member profile when
 *  the user document carries real data (fullName); registration functions
 *  already write the full profile, so an empty profile document is never
 *  created here. */
export const onUserCreated = onDocumentCreated('users/{uid}', async (event) => {
  const snap = event.data; if (!snap) return;
  const u = snap.data();
  if (!u?.fullName) return; // no real data yet — do not create an empty profile
  await db.doc(`member_profiles/${event.params.uid}`).set({
    uid: event.params.uid, fullName: u.fullName, role: u.role ?? 'pending',
    active: true, createdAt: now(),
  }, { merge: true });
});
