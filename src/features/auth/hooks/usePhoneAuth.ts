'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ConfirmationResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { getFirebaseAuth } from 'config/firebase';
import { registerNewUser } from '../utils/registerNewUser';

type PhoneStatus = 'idle' | 'loading' | 'pending' | 'success' | 'error';

interface UsePhoneAuthReturn {
  sendOtp: (phone: string, containerId: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<boolean>;
  reset: () => void;
  status: PhoneStatus;
  error: string | null;
  otpSent: boolean;
}

export function usePhoneAuth(): UsePhoneAuthReturn {
  const [status, setStatus] = useState<PhoneStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    return () => {
      recaptchaRef.current?.clear();
    };
  }, []);

  const sendOtp = async (phone: string, containerId: string): Promise<void> => {
    setStatus('loading');
    setError(null);
    try {
      const auth = getFirebaseAuth();
      if (!recaptchaRef.current) {
        recaptchaRef.current = new RecaptchaVerifier(auth, containerId, {
          size: 'invisible',
        });
      }
      confirmationRef.current = await signInWithPhoneNumber(
        auth,
        phone,
        recaptchaRef.current
      );
      setOtpSent(true);
      setStatus('pending');
    } catch (err) {
      recaptchaRef.current?.clear();
      recaptchaRef.current = null;
      setError(getPhoneErrorMessage(err));
      setStatus('error');
    }
  };

  const verifyOtp = async (code: string): Promise<boolean> => {
    if (!confirmationRef.current) return false;
    setStatus('loading');
    setError(null);
    try {
      const credential = await confirmationRef.current.confirm(code);
      await registerNewUser(credential);
      setStatus('success');
      return true;
    } catch (err) {
      setError(getPhoneErrorMessage(err));
      setStatus('error');
      return false;
    }
  };

  const reset = () => {
    recaptchaRef.current?.clear();
    recaptchaRef.current = null;
    confirmationRef.current = null;
    setOtpSent(false);
    setStatus('idle');
    setError(null);
  };

  return { sendOtp, verifyOtp, reset, status, error, otpSent };
}

function getPhoneErrorMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case 'auth/invalid-phone-number':
        return 'Invalid phone number. Please include your country code (e.g. +1 555 000 0000).';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      case 'auth/captcha-check-failed':
        return 'Security check failed. Please try again.';
      case 'auth/quota-exceeded':
        return 'SMS quota exceeded. Please try again later.';
      case 'auth/invalid-verification-code':
        return 'Incorrect code. Please try again.';
      case 'auth/code-expired':
      case 'auth/session-expired':
        return 'This code has expired. Please request a new one.';
      default:
        return 'An unexpected error occurred.';
    }
  }
  return 'An unexpected error occurred.';
}
