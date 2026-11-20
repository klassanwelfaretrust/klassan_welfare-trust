import { httpsCallable } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, app } from '../firebase/config';
const fn = getFunctions(app);
export type Category = 'upper' | 'middle' | 'third';
export async function submitFamilyVote(familyId: string, category: Category) {
  const res = await httpsCallable(fn, 'submitFamilyVote')({ familyId, category });
  return res.data as { counts: Record<string, number>; finalised: Category | null };
}
export async function getFamilyVotes(familyId: string) {
  const q = query(collection(db, 'family_category_votes'), where('familyId', '==', familyId));
  const votes = (await getDocs(q)).docs.map((d) => ({ id: d.id, ...d.data() }));
  const cat = await getDoc(doc(db, 'family_categories', familyId));
  return { votes, finalCategory: cat.exists() ? (cat.data().category as Category) : null, counts: cat.exists() ? cat.data().votes : null };
}
