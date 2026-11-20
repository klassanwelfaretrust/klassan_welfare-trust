import { collection, getDocs, getDoc, doc, query, where, orderBy, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
export interface ChildEntry { fullName: string; occupation: string; age: number | ''; }
export interface OtherMember { name: string; status: string; }
export interface FamilyInput {
  headName: string; householdCount: number; headOccupation: string;
  sons: ChildEntry[]; daughters: ChildEntry[]; otherMembers: OtherMember[];
}
// Submitted as ONE connected record: family doc + family_members sub-rows,
// written in a single batch (M2) — a dropped connection can no longer leave
// a family saved with only some of its members.
// Status is always 'pending' — approval happens only via approveFamily Function.
export async function submitFamily(createdBy: string, input: FamilyInput) {
  const batch = writeBatch(db);
  const ref = doc(collection(db, 'families'));
  batch.set(ref, {
    headName: input.headName, householdCount: input.householdCount, headOccupation: input.headOccupation,
    status: 'pending', createdBy, createdAt: serverTimestamp(),
  });
  const members = [
    ...input.sons.map((s) => ({ familyId: ref.id, relation: 'son', ...s })),
    ...input.daughters.map((s) => ({ familyId: ref.id, relation: 'daughter', ...s })),
    ...input.otherMembers.map((s) => ({ familyId: ref.id, relation: 'other', fullName: s.name, occupation: s.status, age: '' })),
  ];
  for (const m of members) batch.set(doc(collection(db, 'family_members')), { ...m, createdAt: serverTimestamp() });
  await batch.commit();
  return ref.id;
}
export async function listApprovedFamilies() {
  const q = query(collection(db, 'families'), where('status', '==', 'approved'), orderBy('createdAt', 'desc'));
  return (await getDocs(q)).docs.map((d) => ({ id: d.id, ...d.data() }));
}
export async function getFamilyDetail(familyId: string) {
  const fam = await getDoc(doc(db, 'families', familyId));
  const q = query(collection(db, 'family_members'), where('familyId', '==', familyId));
  const members = (await getDocs(q)).docs.map((d) => ({ id: d.id, ...d.data() }));
  return { family: fam.exists() ? { id: fam.id, ...fam.data() } : null, members };
}
