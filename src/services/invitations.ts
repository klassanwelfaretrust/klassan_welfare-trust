import { httpsCallable } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { app, db } from '../firebase/config';
const fn = getFunctions(app);
export type InviteRole = 'super_admin' | 'assistant' | 'member';
export async function createInvitation(forRole: InviteRole, superAdminUid?: string) {
  const res = await httpsCallable(fn, 'createInvitation')({ forRole, superAdminUid });
  return res.data as { invitationId: string; token: string; url: string; expiresAt: string };
}
export async function redeemInvitation(invitationId: string, token: string) {
  const res = await httpsCallable(fn, 'redeemInvitation')({ invitationId, token });
  return res.data as { forRole: InviteRole; superAdminUid: string | null };
}
// Read-only check used by the registration page on load: validates the
// invitation WITHOUT using it up. Redemption happens exactly once, inside
// registerApplicant when the form is submitted.
export async function checkInvitation(invitationId: string, token: string) {
  const res = await httpsCallable(fn, 'checkInvitation')({ invitationId, token });
  return res.data as { forRole: InviteRole; superAdminUid: string | null };
}
// Active, unexpired Super Admin invitations (President only, per the
// tightened rules) — used for the 4-seat count on the President Dashboard.
export async function listActiveSuperAdminInvites() {
  const q = query(collection(db, 'registration_invitations'), where('forRole', '==', 'super_admin'), where('status', '==', 'active'));
  const rows = (await getDocs(q)).docs.map((d) => ({ id: d.id, ...d.data() }));
  return rows.filter((r: any) => (r.expiresAt?.toMillis?.() ?? 0) > Date.now());
}
