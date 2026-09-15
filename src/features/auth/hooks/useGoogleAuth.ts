'use client';

import { useState } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { getFirebaseAuth } from 'config/firebase';
import { registerNewUser } from '../utils/registerNewUser';

type GoogleStatus = 'idle' | 'loading' | 'error';

interface UseGoogleAuthReturn {
  signInWithGoogle: () => Promise<void>;
  status: GoogleStatus;
  error: string | null;
}

const provider = new GoogleAuthProvider();

export function useGoogleAuth(): UseGoogleAuthReturn {
  const [status, setStatus] = useState<GoogleStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const signInWithGoogle = async () => {
    setStatus('loading');
    setError(null);

    // When focus returns to this window the popup was closed by the user.
    // Reset the button immediately instead of waiting 2-3 s for Firebase's
    // own polling to fire 'auth/popup-closed-by-user'.
    let focusTimer: ReturnType<typeof setTimeout> | null = null;
    const onWindowFocus = () => {
      focusTimer = setTimeout(() => setStatus('idle'), 300);
    };
    // Delay attaching so we don't react to focus lost during popup open.
    const attachTimer = setTimeout(
      () => window.addEventListener('focus', onWindowFocus),
      800
    );

    try {
      const auth = getFirebaseAuth();
      const credential = await signInWithPopup(auth, provider);
      await registerNewUser(credential);
      // onAuthStateChanged in AuthProvider picks up the signed-in user;
      // SignInForm's authStatus effect handles the redirect.
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : null;
      const cancelled =
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request';
      if (!cancelled) {
        setError(getGoogleErrorMessage(err));
      }
    } finally {
      clearTimeout(attachTimer);
      if (focusTimer !== null) clearTimeout(focusTimer);
      window.removeEventListener('focus', onWindowFocus);
      setStatus('idle');
    }
  };

  return { signInWithGoogle, status, error };
}

function getGoogleErrorMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case 'auth/popup-blocked':
        return 'Pop-up was blocked by your browser. Please allow pop-ups for this site and try again.';
      case 'auth/account-exists-with-different-credential':
        return 'An account already exists with a different sign-in method.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection and try again.';
      default:
        return 'An unexpected error occurred.';
    }
  }
  return 'An unexpected error occurred.';
}
