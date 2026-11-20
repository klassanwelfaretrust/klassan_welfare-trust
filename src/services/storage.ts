import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';
import { validateImageFile } from '../lib/validation';
// CNIC docs go to private/{uid}/ (rules: owner + President/Super Admin only).
// Profile photos go to profiles/{uid}/ (rules: any signed-in member may view).
export async function uploadIdentityImage(uid: string, kind: 'cnic-front' | 'cnic-back', file: File) {
  const err = validateImageFile(file); if (err) throw new Error(err === 'type' ? 'Invalid image type.' : 'Image larger than 5 MB.');
  const r = ref(storage, `private/${uid}/${kind}.${file.name.split('.').pop()}`);
  await uploadBytes(r, file); return getDownloadURL(r);
}
export async function uploadProfilePhoto(uid: string, file: File) {
  const err = validateImageFile(file); if (err) throw new Error(err === 'type' ? 'Invalid image type.' : 'Image larger than 5 MB.');
  const r = ref(storage, `profiles/${uid}/photo.${file.name.split('.').pop()}`);
  await uploadBytes(r, file); return getDownloadURL(r);
}
