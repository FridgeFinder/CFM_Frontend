import { renderHook, act } from '@testing-library/react';
import { FirebaseError } from 'firebase/app';
import { signInWithPopup } from 'firebase/auth';
import { registerNewUser } from 'features/auth/utils/registerNewUser';
import { useGoogleAuth } from '../useGoogleAuth';

// GoogleAuthProvider is instantiated at module level in useGoogleAuth, so it
// must be mocked before the module loads.
jest.mock('firebase/auth', () => ({
  GoogleAuthProvider: jest.fn().mockImplementation(() => ({})),
  signInWithPopup: jest.fn(),
}));

const mockAuth = {};

jest.mock('config/firebase', () => ({
  getFirebaseAuth: jest.fn(() => mockAuth),
}));

jest.mock('features/auth/utils/registerNewUser', () => ({
  registerNewUser: jest.fn().mockResolvedValue(undefined),
}));

const mockSignInWithPopup = signInWithPopup as jest.Mock;
const mockRegisterNewUser = registerNewUser as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('successful sign-in', () => {
  it('calls registerNewUser with the credential', async () => {
    const mockCredential = { user: { uid: 'uid-1' } };
    mockSignInWithPopup.mockResolvedValue(mockCredential);

    const { result } = renderHook(() => useGoogleAuth());

    await act(async () => {
      await result.current.signInWithGoogle();
    });

    expect(mockRegisterNewUser).toHaveBeenCalledWith(mockCredential);
  });

  it('returns to idle status after sign-in completes', async () => {
    mockSignInWithPopup.mockResolvedValue({ user: {} });

    const { result } = renderHook(() => useGoogleAuth());

    await act(async () => {
      await result.current.signInWithGoogle();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBeNull();
  });
});

describe('cancelled popup', () => {
  it.each([['auth/popup-closed-by-user'], ['auth/cancelled-popup-request']])(
    'sets no error for %s',
    async (code) => {
      mockSignInWithPopup.mockRejectedValue(new FirebaseError(code, code));

      const { result } = renderHook(() => useGoogleAuth());

      await act(async () => {
        await result.current.signInWithGoogle();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.status).toBe('idle');
      expect(mockRegisterNewUser).not.toHaveBeenCalled();
    }
  );
});

describe('error message mapping', () => {
  const cases: [string, string][] = [
    [
      'auth/popup-blocked',
      'Pop-up was blocked by your browser. Please allow pop-ups for this site and try again.',
    ],
    [
      'auth/account-exists-with-different-credential',
      'An account already exists with a different sign-in method.',
    ],
    [
      'auth/network-request-failed',
      'Network error. Please check your connection and try again.',
    ],
  ];

  test.each(cases)(
    '%s maps to the correct message',
    async (code, expectedMessage) => {
      mockSignInWithPopup.mockRejectedValue(new FirebaseError(code, code));

      const { result } = renderHook(() => useGoogleAuth());

      await act(async () => {
        await result.current.signInWithGoogle();
      });

      expect(result.current.error).toBe(expectedMessage);
      expect(result.current.status).toBe('idle');
    }
  );

  it('returns a generic message for unknown error codes', async () => {
    mockSignInWithPopup.mockRejectedValue(
      new FirebaseError('auth/unknown', 'Unexpected failure')
    );

    const { result } = renderHook(() => useGoogleAuth());

    await act(async () => {
      await result.current.signInWithGoogle();
    });

    expect(result.current.error).toBe('An unexpected error occurred.');
  });
});
