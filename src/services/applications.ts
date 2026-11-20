import { httpsCallable } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db, app } from '../firebase/config';
const fn = getFunctions(app);
const call = (name: string, data: unknown) => httpsCallable(fn, name)(data);
export const approveSuperAdmin = (applicationId: string, approve: boolean, reason = '') => call('approveSuperAdmin', { applicationId, approve, reason });
export const approveAssistantStage1 = (applicationId: string, approve: boolean, reason = '') => call('approveAssistantStage1', { applicationId, approve, reason });
export const approveAssistantStage2 = (applicationId: string, approve: boolean, reason = '') => call('approveAssistantStage2', { applicationId, approve, reason });
export const approveFamily = (familyId: string, approve: boolean, reason = '') => call('approveFamily', { familyId, approve, reason });
export const approveMember = (applicationId: string, approve: boolean, reason = '') => call('approveMember', { applicationId, approve, reason });
export const approveWidow = (widowId: string, approve: boolean, reason = '') => call('approveWidow', { widowId, approve, reason });
export const dismissUser = (targetUid: string, reason = '') => call('dismissUser', { targetUid, reason });
export const removeSickPerson = (sickId: string, reason = '') => call('removeSickPerson', { sickId, reason });
export const removeMember = (targetUid: string, reason = '') => call('removeMember', { targetUid, reason });
export async function listPendingSuperAdminApplications() {
  const q = query(collection(db, 'super_admin_applications'), where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
  return (await getDocs(q)).docs.map((d) => ({ id: d.id, ...d.data() }));
}
export async function listPendingAssistantApplications(superAdminUid?: string) {
  const base = [where('status', 'in', ['pending_super_admin', 'pending_president'])];
  if (superAdminUid) base.push(where('superAdminUid', '==', superAdminUid));
  const q = query(collection(db, 'assistant_applications'), ...base, orderBy('createdAt', 'desc'));
  return (await getDocs(q)).docs.map((d) => ({ id: d.id, ...d.data() }));
}
export async function listPendingMemberApplications() {
  const q = query(collection(db, 'member_applications'), where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
  return (await getDocs(q)).docs.map((d) => ({ id: d.id, ...d.data() }));
}
export async function listPendingWidows() {
  const q = query(collection(db, 'widow_records'), where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
  return (await getDocs(q)).docs.map((d) => ({ id: d.id, ...d.data() }));
}
export async function listPendingFamilies() {
  const q = query(collection(db, 'families'), where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
  return (await getDocs(q)).docs.map((d) => ({ id: d.id, ...d.data() }));
}
