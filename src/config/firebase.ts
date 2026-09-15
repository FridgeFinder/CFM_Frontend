import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

let auth: Auth | undefined;
let isAuthEmulatorConnected = false;

export const getFirebaseAuth = (): Auth => {
  const app =
    getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
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
