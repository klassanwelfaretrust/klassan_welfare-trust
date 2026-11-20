import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
// Directory reads only — no sample/fake records anywhere in this codebase.
// Pending (unapproved) applicants are NOT listed: only approved members
// appear in the directory and on Home (C5).
export async function listMembers() {
  const q = query(collection(db, 'member_profiles'), where('active', '==', true), orderBy('createdAt', 'desc'));
  const rows = (await getDocs(q)).docs.map((d) => ({ id: d.id, ...d.data() }));
  return rows.filter((m: any) => m.role !== 'pending');
}
export async function listSuperAdmins() {
  const q = query(collection(db, 'super_admins'), where('active', '==', true));
  return (await getDocs(q)).docs.map((d) => ({ id: d.id, ...d.data() }));
}
export async function listAssistantFor(superAdminUid: string) {
  const q = query(collection(db, 'assistant_admins'), where('superAdminUid', '==', superAdminUid), where('active', '==', true));
  return (await getDocs(q)).docs.map((d) => ({ id: d.id, ...d.data() }));
}
