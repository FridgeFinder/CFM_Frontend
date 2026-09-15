import { renderHook, act } from '@testing-library/react';
import { FirebaseError } from 'firebase/app';
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  EmailAuthProvider,
  linkWithCredential,
} from 'firebase/auth';
import {
  useLinkEmail,
  confirmLinkEmail,
  LINK_EMAIL_KEY,
  LINK_EMAIL_RETURN_KEY,
} from '../useLinkEmail';

jest.mock('firebase/auth', () => ({
  sendSignInLinkToEmail: jest.fn(),
  isSignInWithEmailLink: jest.fn(),
  EmailAuthProvider: { credentialWithLink: jest.fn() },
  linkWithCredential: jest.fn(),
}));

const mockAuth: { currentUser: null | { uid: string } } = {
  currentUser: null,
};

jest.mock('config/firebase', () => ({
  getFirebaseAuth: jest.fn(() => mockAuth),
}));

const mockSendSignInLinkToEmail = sendSignInLinkToEmail as jest.Mock;
const mockIsSignInWithEmailLink = isSignInWithEmailLink as jest.Mock;
const mockCredentialWithLink =
  EmailAuthProvider.credentialWithLink as jest.Mock;
const mockLinkWithCredential = linkWithCredential as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  mockAuth.currentUser = null;
  mockIsSignInWithEmailLink.mockReturnValue(true);
});

describe('sendLinkEmail', () => {
  it('sets status to success and stores the email in localStorage', async () => {
    mockSendSignInLinkToEmail.mockResolvedValue(undefined);

    const { result } = renderHook(() => useLinkEmail());

    await act(async () => {
      await result.current.sendLinkEmail('user@example.com');
    });

    expect(result.current.status).toBe('success');
    expect(result.current.error).toBeNull();
    expect(localStorage.getItem(LINK_EMAIL_KEY)).toBe('user@example.com');
  });

  it('stores the returnPath in LINK_EMAIL_RETURN_KEY when provided', async () => {
    mockSendSignInLinkToEmail.mockResolvedValue(undefined);

    const { result } = renderHook(() => useLinkEmail());

    await act(async () => {
      await result.current.sendLinkEmail('user@example.com', '/settings');
    });

    expect(localStorage.getItem(LINK_EMAIL_RETURN_KEY)).toBe('/settings');
  });

  it('does not store LINK_EMAIL_RETURN_KEY when returnPath is omitted', async () => {
    mockSendSignInLinkToEmail.mockResolvedValue(undefined);

    const { result } = renderHook(() => useLinkEmail());

    await act(async () => {
      await result.current.sendLinkEmail('user@example.com');
    });

    expect(localStorage.getItem(LINK_EMAIL_RETURN_KEY)).toBeNull();
  });

  it('sets status to error and sets the error message on failure', async () => {
    mockSendSignInLinkToEmail.mockRejectedValue(
      new FirebaseError('auth/invalid-email', 'invalid')
    );

    const { result } = renderHook(() => useLinkEmail());

    await act(async () => {
      await result.current.sendLinkEmail('not-an-email');
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('Invalid email address.');
  });
});

describe('reset', () => {
  it('resets status and error back to idle/null', async () => {
    mockSendSignInLinkToEmail.mockRejectedValue(
      new FirebaseError('auth/invalid-email', 'fail')
    );

    const { result } = renderHook(() => useLinkEmail());

    await act(async () => {
      await result.current.sendLinkEmail('x@y.com');
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
      'auth/email-already-in-use',
      'This email is already associated with another account. Please sign in with that account instead, or contact support.',
    ],
    [
      'auth/provider-already-linked',
      'An email address is already linked to your account.',
    ],
    [
      'auth/invalid-action-code',
      'This link is invalid or has already been used.',
    ],
    [
      'auth/expired-action-code',
      'This link has expired. Please request a new one.',
    ],
  ];

  test.each(cases)(
    '%s maps to the correct message',
    async (code, expectedMessage) => {
      mockSendSignInLinkToEmail.mockRejectedValue(
        new FirebaseError(code, code)
      );

      const { result } = renderHook(() => useLinkEmail());

      await act(async () => {
        await result.current.sendLinkEmail('user@example.com');
      });

      expect(result.current.error).toBe(expectedMessage);
    }
  );

  it('returns a generic message for unknown error codes', async () => {
    mockSendSignInLinkToEmail.mockRejectedValue(
      new FirebaseError('auth/unknown-code', 'Unknown')
    );

    const { result } = renderHook(() => useLinkEmail());

    await act(async () => {
      await result.current.sendLinkEmail('user@example.com');
    });

    expect(result.current.error).toBe('An unexpected error occurred.');
  });
});

describe('confirmLinkEmail', () => {
  it('throws when the URL is not a valid email link', async () => {
    mockIsSignInWithEmailLink.mockReturnValue(false);

    await expect(confirmLinkEmail()).rejects.toThrow(
      'This link is not a valid email-link credential.'
    );
  });

  it('throws no-user when there is no current user', async () => {
    mockAuth.currentUser = null;

    await expect(confirmLinkEmail()).rejects.toThrow('no-user');
  });

  it('throws needs-email when no email is available and no override is provided', async () => {
    mockAuth.currentUser = { uid: 'test-uid' };

    await expect(confirmLinkEmail()).rejects.toThrow('needs-email');
  });

  it('links the email credential and returns the email', async () => {
    const mockCredential = { providerId: 'email' };
    mockAuth.currentUser = { uid: 'test-uid' };
    localStorage.setItem(LINK_EMAIL_KEY, 'user@example.com');
    mockCredentialWithLink.mockReturnValue(mockCredential);
    mockLinkWithCredential.mockResolvedValue(undefined);

    const email = await confirmLinkEmail();

    expect(email).toBe('user@example.com');
    expect(mockLinkWithCredential).toHaveBeenCalledWith(
      mockAuth.currentUser,
      mockCredential
    );
  });

  it('uses the emailOverride instead of localStorage', async () => {
    mockAuth.currentUser = { uid: 'test-uid' };
    mockCredentialWithLink.mockReturnValue({});
    mockLinkWithCredential.mockResolvedValue(undefined);

    const email = await confirmLinkEmail('override@example.com');

    expect(email).toBe('override@example.com');
    expect(mockCredentialWithLink).toHaveBeenCalledWith(
      'override@example.com',
      expect.any(String)
    );
  });

  it('removes LINK_EMAIL_KEY from localStorage on success', async () => {
    mockAuth.currentUser = { uid: 'test-uid' };
    localStorage.setItem(LINK_EMAIL_KEY, 'user@example.com');
    mockCredentialWithLink.mockReturnValue({});
    mockLinkWithCredential.mockResolvedValue(undefined);

    await confirmLinkEmail();

    expect(localStorage.getItem(LINK_EMAIL_KEY)).toBeNull();
  });

  it('leaves LINK_EMAIL_RETURN_KEY in localStorage for the page to handle', async () => {
    mockAuth.currentUser = { uid: 'test-uid' };
    localStorage.setItem(LINK_EMAIL_KEY, 'user@example.com');
    localStorage.setItem(LINK_EMAIL_RETURN_KEY, '/settings');
    mockCredentialWithLink.mockReturnValue({});
    mockLinkWithCredential.mockResolvedValue(undefined);

    await confirmLinkEmail();

    expect(localStorage.getItem(LINK_EMAIL_RETURN_KEY)).toBe('/settings');
  });
});
