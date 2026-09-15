'use client';

import { useState } from 'react';
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  EmailAuthProvider,
  linkWithCredential,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { getFirebaseAuth } from 'config/firebase';

type LinkEmailStatus = 'idle' | 'loading' | 'success' | 'error';

/** localStorage keys — kept separate from the sign-in flow keys */
export const LINK_EMAIL_KEY = 'ff-link-email';
export const LINK_EMAIL_RETURN_KEY = 'ff-link-email-return';

interface UseLinkEmailReturn {
  sendLinkEmail: (email: string, returnPath?: string) => Promise<void>;
  status: LinkEmailStatus;
  error: string | null;
  reset: () => void;
}

export function useLinkEmail(): UseLinkEmailReturn {
  const [status, setStatus] = useState<LinkEmailStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const sendLinkEmail = async (
    email: string,
    returnPath?: string
  ): Promise<void> => {
    setStatus('loading');
    setError(null);
    try {
      const auth = getFirebaseAuth();
      const actionCodeSettings = {
        url: `${window.location.origin}/auth/link-email`,
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem(LINK_EMAIL_KEY, email);
      if (returnPath) {
        window.localStorage.setItem(LINK_EMAIL_RETURN_KEY, returnPath);
      }
      setStatus('success');
    } catch (err) {
      setError(getLinkEmailErrorMessage(err));
      setStatus('error');
    }
  };

  const reset = () => {
    setStatus('idle');
    setError(null);
  };

  return { sendLinkEmail, status, error, reset };
}

/**
 * Called from the /auth/link-email callback page.
 * Links the email credential to the currently signed-in user.
 * Returns the email used so the caller can update the users API.
 */
export async function confirmLinkEmail(
  emailOverride?: string
): Promise<string> {
  const auth = getFirebaseAuth();

  if (!isSignInWithEmailLink(auth, window.location.href)) {
    throw new Error('This link is not a valid email-link credential.');
  }

  const user = auth.currentUser;
  if (!user) {
    throw new Error('no-user');
  }

  const email = emailOverride ?? window.localStorage.getItem(LINK_EMAIL_KEY);
  if (!email) {
    throw new Error('needs-email');
  }

  await linkWithCredential(
    user,
    EmailAuthProvider.credentialWithLink(email, window.location.href)
  );

  window.localStorage.removeItem(LINK_EMAIL_KEY);
  // Note: LINK_EMAIL_RETURN_KEY is intentionally left for the page to read and clear
  // so the redirect still works after this function returns.

  return email;
}

function getLinkEmailErrorMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/email-already-in-use':
        return 'This email is already associated with another account. Please sign in with that account instead, or contact support.';
      case 'auth/provider-already-linked':
        return 'An email address is already linked to your account.';
      case 'auth/invalid-action-code':
        return 'This link is invalid or has already been used.';
      case 'auth/expired-action-code':
        return 'This link has expired. Please request a new one.';
      default:
        return 'An unexpected error occurred.';
    }
  }
  return 'An unexpected error occurred.';
}
