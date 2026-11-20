// Widow / Needy / Sick records — separate collections, independent of each other.
// Removing a sick record never touches families or member_profiles (see Function).
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
export async function addWidow(createdBy: string, data: { widowName: string; headName?: string; address?: string; notes?: string }) {
  return addDoc(collection(db, 'widow_records'), { ...data, status: 'pending', createdBy, createdAt: serverTimestamp() });
}
export async function listWidows() {
  const q = query(collection(db, 'widow_records'), orderBy('createdAt', 'desc'));
  return (await getDocs(q)).docs.map((d) => ({ id: d.id, ...d.data() }));
}
export async function listApprovedWidows() {
  const q = query(collection(db, 'widow_records'), where('status', '==', 'approved'), orderBy('createdAt', 'desc'));
  return (await getDocs(q)).docs.map((d) => ({ id: d.id, ...d.data() }));
}
export async function addNeedy(createdBy: string, data: { fullName: string; address?: string; need?: string; notes?: string }) {
  return addDoc(collection(db, 'needy_people'), { ...data, active: true, createdBy, createdAt: serverTimestamp() });
}
export async function listNeedy() {
  const q = query(collection(db, 'needy_people'), where('active', '==', true), orderBy('createdAt', 'desc'));
  return (await getDocs(q)).docs.map((d) => ({ id: d.id, ...d.data() }));
}
export async function addSick(createdBy: string, data: { personName: string; illness: string; familyId?: string; memberUid?: string }) {
  return addDoc(collection(db, 'sick_people'), { ...data, active: true, createdBy, createdAt: serverTimestamp() });
}
export async function listSick() {
  const q = query(collection(db, 'sick_people'), where('active', '==', true), orderBy('createdAt', 'desc'));
  return (await getDocs(q)).docs.map((d) => ({ id: d.id, ...d.data() }));
}
