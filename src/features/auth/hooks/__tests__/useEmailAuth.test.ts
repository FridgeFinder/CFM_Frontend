import { renderHook, act } from '@testing-library/react';
import { FirebaseError } from 'firebase/app';
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from 'firebase/auth';
import { registerNewUser } from 'features/auth/utils/registerNewUser';
import { useEmailAuth, SIGN_IN_EMAIL_KEY } from '../useEmailAuth';

jest.mock('firebase/auth', () => ({
  sendSignInLinkToEmail: jest.fn(),
  isSignInWithEmailLink: jest.fn(),
  signInWithEmailLink: jest.fn(),
}));

const mockAuth = {};

jest.mock('config/firebase', () => ({
  getFirebaseAuth: jest.fn(() => mockAuth),
}));

jest.mock('features/auth/utils/registerNewUser', () => ({
  registerNewUser: jest.fn().mockResolvedValue(undefined),
}));

const mockSendSignInLinkToEmail = sendSignInLinkToEmail as jest.Mock;
const mockIsSignInWithEmailLink = isSignInWithEmailLink as jest.Mock;
const mockSignInWithEmailLink = signInWithEmailLink as jest.Mock;
const mockRegisterNewUser = registerNewUser as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  // Default: URL is a valid email link
  mockIsSignInWithEmailLink.mockReturnValue(true);
});

describe('sendSignInLink', () => {
  it('sets status to success and stores the email in localStorage', async () => {
    mockSendSignInLinkToEmail.mockResolvedValue(undefined);

    const { result } = renderHook(() => useEmailAuth());

    await act(async () => {
      await result.current.sendSignInLink('user@example.com');
    });

    expect(result.current.status).toBe('success');
    expect(result.current.error).toBeNull();
    expect(localStorage.getItem(SIGN_IN_EMAIL_KEY)).toBe('user@example.com');
  });

  it('sets status to error and sets the error message on failure', async () => {
    const firebaseError = new FirebaseError(
      'auth/invalid-email',
      'Something went wrong'
    );
    mockSendSignInLinkToEmail.mockRejectedValue(firebaseError);

    const { result } = renderHook(() => useEmailAuth());

    await act(async () => {
      await result.current.sendSignInLink('bad-email');
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('Invalid email address.');
  });
});

describe('confirmSignIn', () => {
  it("returns 'needs-email' when the URL is not a sign-in link", async () => {
    mockIsSignInWithEmailLink.mockReturnValue(false);

    const { result } = renderHook(() => useEmailAuth());
    let outcome: string | undefined;

    await act(async () => {
      outcome = await result.current.confirmSignIn();
    });

    expect(outcome).toBe('needs-email');
    expect(mockSignInWithEmailLink).not.toHaveBeenCalled();
  });

  it("returns 'needs-email' when no email is available", async () => {
    localStorage.removeItem(SIGN_IN_EMAIL_KEY);

    const { result } = renderHook(() => useEmailAuth());
    let outcome: string | undefined;

    await act(async () => {
      outcome = await result.current.confirmSignIn();
    });

    expect(outcome).toBe('needs-email');
  });

  it("returns 'success', calls registerNewUser, and clears localStorage on success", async () => {
    localStorage.setItem(SIGN_IN_EMAIL_KEY, 'stored@example.com');
    const mockCredential = { user: { uid: 'uid-1' } };
    mockSignInWithEmailLink.mockResolvedValue(mockCredential);

    const { result } = renderHook(() => useEmailAuth());
    let outcome: string | undefined;

    await act(async () => {
      outcome = await result.current.confirmSignIn();
    });

    expect(outcome).toBe('success');
    expect(mockRegisterNewUser).toHaveBeenCalledWith(mockCredential);
    expect(localStorage.getItem(SIGN_IN_EMAIL_KEY)).toBeNull();
    expect(result.current.status).toBe('success');
  });

  it('uses the emailOverride argument instead of localStorage', async () => {
    const mockCredential = { user: { uid: 'uid-2' } };
    mockSignInWithEmailLink.mockResolvedValue(mockCredential);

    const { result } = renderHook(() => useEmailAuth());

    await act(async () => {
      await result.current.confirmSignIn('override@example.com');
    });

    expect(mockSignInWithEmailLink).toHaveBeenCalledWith(
      expect.anything(),
      'override@example.com',
      expect.any(String)
    );
  });

  it("returns 'error' and sets the error message on failure", async () => {
    localStorage.setItem(SIGN_IN_EMAIL_KEY, 'user@example.com');
    const firebaseError = new FirebaseError(
      'auth/expired-action-code',
      'Link expired'
    );
    mockSignInWithEmailLink.mockRejectedValue(firebaseError);

    const { result } = renderHook(() => useEmailAuth());
    let outcome: string | undefined;

    await act(async () => {
      outcome = await result.current.confirmSignIn();
    });

    expect(outcome).toBe('error');
    expect(result.current.error).toBe(
      'This sign-in link has expired. Please request a new one.'
    );
  });
});

describe('reset', () => {
  it('resets status and error back to idle/null', async () => {
    mockSendSignInLinkToEmail.mockRejectedValue(
      new FirebaseError('auth/invalid-email', 'fail')
    );

    const { result } = renderHook(() => useEmailAuth());

    await act(async () => {
      await result.current.sendSignInLink('x');
    });

    expect(result.current.status).toBe('error');

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBeNull();
  });
});

describe('error message mapping', () => {
  const cases: [string, string][] = [
    ['auth/invalid-email', 'Invalid email address.'],
    [
      'auth/invalid-action-code',
      'This sign-in link is invalid or has already been used.',
    ],
    [
      'auth/expired-action-code',
      'This sign-in link has expired. Please request a new one.',
    ],
  ];

  test.each(cases)(
    '%s maps to the correct message',
    async (code, expectedMessage) => {
      mockSendSignInLinkToEmail.mockRejectedValue(
        new FirebaseError(code, code)
      );

      const { result } = renderHook(() => useEmailAuth());

      await act(async () => {
        await result.current.sendSignInLink('user@example.com');
      });

      expect(result.current.error).toBe(expectedMessage);
    }
  );

  it('falls back to err.message for unknown FirebaseError codes', async () => {
    mockSendSignInLinkToEmail.mockRejectedValue(
      new FirebaseError('auth/unknown-code', 'Something unusual happened')
    );

    const { result } = renderHook(() => useEmailAuth());

    await act(async () => {
      await result.current.sendSignInLink('user@example.com');
    });

    expect(result.current.error).toBe('Something unusual happened');
  });
});
