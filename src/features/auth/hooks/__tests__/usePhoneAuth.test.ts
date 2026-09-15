import { renderHook, act } from '@testing-library/react';
import { FirebaseError } from 'firebase/app';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { registerNewUser } from 'features/auth/utils/registerNewUser';
import { usePhoneAuth } from '../usePhoneAuth';

jest.mock('firebase/auth', () => ({
  RecaptchaVerifier: jest.fn(),
  signInWithPhoneNumber: jest.fn(),
}));

const mockAuth = {};

jest.mock('config/firebase', () => ({
  getFirebaseAuth: jest.fn(() => mockAuth),
}));

jest.mock('features/auth/utils/registerNewUser', () => ({
  registerNewUser: jest.fn().mockResolvedValue(undefined),
}));

const mockRecaptchaVerifier = RecaptchaVerifier as jest.Mock;
const mockSignInWithPhoneNumber = signInWithPhoneNumber as jest.Mock;
const mockRegisterNewUser = registerNewUser as jest.Mock;

const mockConfirmation = { confirm: jest.fn() };
const mockRecaptchaInstance = { clear: jest.fn() };

beforeEach(() => {
  jest.clearAllMocks();
  mockRecaptchaVerifier.mockImplementation(() => mockRecaptchaInstance);
  mockSignInWithPhoneNumber.mockResolvedValue(mockConfirmation);
});

describe('sendOtp', () => {
  it('sets otpSent to true and status to pending on success', async () => {
    const { result } = renderHook(() => usePhoneAuth());

    await act(async () => {
      await result.current.sendOtp('+15551234567', 'recaptcha-container');
    });

    expect(result.current.otpSent).toBe(true);
    expect(result.current.status).toBe('pending');
    expect(result.current.error).toBeNull();
  });

  it('creates a RecaptchaVerifier with the provided container id', async () => {
    const { result } = renderHook(() => usePhoneAuth());

    await act(async () => {
      await result.current.sendOtp('+15551234567', 'recaptcha-container');
    });

    expect(mockRecaptchaVerifier).toHaveBeenCalledWith(
      expect.anything(),
      'recaptcha-container',
      expect.objectContaining({ size: 'invisible' })
    );
  });

  it('sets status to error and sets error message on failure', async () => {
    mockSignInWithPhoneNumber.mockRejectedValue(
      new FirebaseError('auth/invalid-phone-number', 'invalid')
    );

    const { result } = renderHook(() => usePhoneAuth());

    await act(async () => {
      await result.current.sendOtp('not-a-phone', 'recaptcha-container');
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe(
      'Invalid phone number. Please include your country code (e.g. +1 555 000 0000).'
    );
    expect(result.current.otpSent).toBe(false);
  });

  it('clears the recaptcha instance on failure', async () => {
    mockSignInWithPhoneNumber.mockRejectedValue(
      new FirebaseError('auth/captcha-check-failed', 'fail')
    );

    const { result } = renderHook(() => usePhoneAuth());

    await act(async () => {
      await result.current.sendOtp('+15551234567', 'recaptcha-container');
    });

    expect(mockRecaptchaInstance.clear).toHaveBeenCalled();
  });
});

describe('verifyOtp', () => {
  it('returns true, calls registerNewUser, and sets status to success', async () => {
    const mockCredential = { user: { uid: 'uid-1' } };
    mockConfirmation.confirm.mockResolvedValue(mockCredential);

    const { result } = renderHook(() => usePhoneAuth());

    // First send OTP to populate confirmationRef
    await act(async () => {
      await result.current.sendOtp('+15551234567', 'recaptcha-container');
    });

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.verifyOtp('123456');
    });

    expect(success).toBe(true);
    expect(mockRegisterNewUser).toHaveBeenCalledWith(mockCredential);
    expect(result.current.status).toBe('success');
    expect(result.current.error).toBeNull();
  });

  it('returns false and sets error message for an invalid code', async () => {
    mockConfirmation.confirm.mockRejectedValue(
      new FirebaseError('auth/invalid-verification-code', 'wrong code')
    );

    const { result } = renderHook(() => usePhoneAuth());

    await act(async () => {
      await result.current.sendOtp('+15551234567', 'recaptcha-container');
    });

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.verifyOtp('000000');
    });

    expect(success).toBe(false);
    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('Incorrect code. Please try again.');
  });

  it('returns false and sets error message for an expired code', async () => {
    mockConfirmation.confirm.mockRejectedValue(
      new FirebaseError('auth/code-expired', 'expired')
    );

    const { result } = renderHook(() => usePhoneAuth());

    await act(async () => {
      await result.current.sendOtp('+15551234567', 'recaptcha-container');
    });

    let outcome: boolean | undefined;
    await act(async () => {
      outcome = await result.current.verifyOtp('123456');
    });

    expect(outcome).toBe(false);
    expect(result.current.error).toBe(
      'This code has expired. Please request a new one.'
    );
  });

  it('returns false and sets error message for a session-expired error', async () => {
    mockConfirmation.confirm.mockRejectedValue(
      new FirebaseError('auth/session-expired', 'session expired')
    );

    const { result } = renderHook(() => usePhoneAuth());

    await act(async () => {
      await result.current.sendOtp('+15551234567', 'recaptcha-container');
    });

    let outcome: boolean | undefined;
    await act(async () => {
      outcome = await result.current.verifyOtp('123456');
    });

    expect(outcome).toBe(false);
    expect(result.current.error).toBe(
      'This code has expired. Please request a new one.'
    );
  });

  it('returns false immediately when OTP was never sent', async () => {
    const { result } = renderHook(() => usePhoneAuth());

    let outcome: boolean | undefined;
    await act(async () => {
      outcome = await result.current.verifyOtp('123456');
    });

    expect(outcome).toBe(false);
    expect(mockConfirmation.confirm).not.toHaveBeenCalled();
  });
});

describe('reset', () => {
  it('clears otpSent, status, and error', async () => {
    mockSignInWithPhoneNumber.mockRejectedValue(
      new FirebaseError('auth/too-many-requests', 'too many')
    );

    const { result } = renderHook(() => usePhoneAuth());

    await act(async () => {
      await result.current.sendOtp('+15551234567', 'recaptcha-container');
    });

    expect(result.current.status).toBe('error');

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBeNull();
    expect(result.current.otpSent).toBe(false);
  });
});

describe('error message mapping', () => {
  const cases: [string, string][] = [
    [
      'auth/invalid-phone-number',
      'Invalid phone number. Please include your country code (e.g. +1 555 000 0000).',
    ],
    ['auth/too-many-requests', 'Too many attempts. Please try again later.'],
    ['auth/captcha-check-failed', 'Security check failed. Please try again.'],
    ['auth/quota-exceeded', 'SMS quota exceeded. Please try again later.'],
  ];

  test.each(cases)(
    '%s maps to the correct message',
    async (code, expectedMessage) => {
      mockSignInWithPhoneNumber.mockRejectedValue(
        new FirebaseError(code, code)
      );

      const { result } = renderHook(() => usePhoneAuth());

      await act(async () => {
        await result.current.sendOtp('+15551234567', 'recaptcha-container');
      });

      expect(result.current.error).toBe(expectedMessage);
    }
  );

  it('returns a generic message for unknown error codes', async () => {
    mockSignInWithPhoneNumber.mockRejectedValue(
      new FirebaseError('auth/unknown-code', 'Something unusual happened')
    );

    const { result } = renderHook(() => usePhoneAuth());

    await act(async () => {
      await result.current.sendOtp('+15551234567', 'recaptcha-container');
    });

    expect(result.current.error).toBe('An unexpected error occurred.');
  });
});
