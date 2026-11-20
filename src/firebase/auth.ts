import { sendPasswordResetEmail } from 'firebase/auth';
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, onAuthStateChanged, type User } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';
import { auth, app } from './config';

const functions = getFunctions(app);
export const login = (email: string, password: string) => signInWithEmailAndPassword(auth, email, password);
export const logout = () => signOut(auth);
// Forgot password: Firebase sends the reset email; no password is ever
// handled or stored by this app.
export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email.trim());
export const onAuthChange = (cb: (u: User | null) => void) => onAuthStateChanged(auth, cb);
// First-time President only — goes through the secure Cloud Function, never a direct Firestore write.
export const initializePresident = async (data: Record<string, unknown>) =>
  (await httpsCallable(functions, 'initializePresident')(data)).data;
// Applicant registration (after redeeming a single-use invite) — also a Function.
export const registerApplicant = async (data: Record<string, unknown>) =>
  (await httpsCallable(functions, 'registerApplicant')(data)).data as { ok: boolean; uid: string };
export { createUserWithEmailAndPassword };
