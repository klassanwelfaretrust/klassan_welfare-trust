import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator, type FirebaseStorage } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Firebase is NOT configured in this repository: .env.example ships empty.
// If any key is missing we fail loudly at boot instead of pretending to work.
//
// EMULATOR MODE (free local preview, no payment, no real Firebase project):
// set VITE_USE_EMULATOR=true in .env — see
// klassan-audit/EMULATOR_GUIDE_BEGINNER.md. Only demo values are used here,
// never real keys. When the flag is off, behaviour is exactly as before.
const useEmulator = import.meta.env.VITE_USE_EMULATOR === 'true';
const required = ['VITE_FIREBASE_API_KEY','VITE_FIREBASE_AUTH_DOMAIN','VITE_FIREBASE_PROJECT_ID','VITE_FIREBASE_STORAGE_BUCKET','VITE_FIREBASE_MESSAGING_SENDER_ID','VITE_FIREBASE_APP_ID'] as const;
const missing = useEmulator ? [] : required.filter((k) => !import.meta.env[k]);
if (missing.length) {
  throw new Error(
    `Firebase is not configured. Missing environment variables: ${missing.join(', ')}. ` +
    `Copy .env.example to .env and fill it from Firebase Console > Project settings. See docs/SETUP_FIREBASE.md.`
  );
}
const firebaseConfig = useEmulator
  ? {
      apiKey: 'demo-key',
      authDomain: 'demo-klassan.firebaseapp.com',
      projectId: 'demo-klassan',
      storageBucket: 'demo-klassan.appspot.com',
      messagingSenderId: '000000000000',
      appId: '1:000000000000:web:demo',
    }
  : {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    };
export const app: FirebaseApp = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
if (useEmulator) {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
  connectFunctionsEmulator(getFunctions(app), 'localhost', 5001);
}
