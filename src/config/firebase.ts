import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

let auth: Auth | undefined;
let firestore: Firestore | undefined;
let isAuthEmulatorConnected = false;

const getFirebaseApp = () =>
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const getFirebaseAuth = (): Auth => {
  const app = getFirebaseApp();
  auth ??= getAuth(app);

  if (
    typeof window !== 'undefined' &&
    process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === 'true' &&
    !isAuthEmulatorConnected
  ) {
    connectAuthEmulator(auth, 'http://localhost:9099', {
      disableWarnings: true,
    });
    isAuthEmulatorConnected = true;
  }

  return auth;
};

export const getFirebaseFirestore = (): Firestore => {
  firestore ??= getFirestore(getFirebaseApp());

  return firestore;
};
