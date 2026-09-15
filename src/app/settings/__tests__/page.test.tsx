import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import {
  clearUserProfileCache,
  updateCachedUserProfile,
  useAuthStore,
} from 'store/useAuthStore';
import { useFollowingStore } from 'store/useFollowingStore';

const TEST_USERS_API_BASE_URL = 'https://users-api-fake.test.com';
process.env.NEXT_PUBLIC_USERS_API_URL = TEST_USERS_API_BASE_URL;

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

jest.mock('firebase/auth', () => ({
  signOut: jest.fn(),
}));

const mockAuth = {};

jest.mock('config/firebase', () => ({
  getFirebaseAuth: jest.fn(() => mockAuth),
}));

jest.mock('store/useAuthStore', () => {
  const mockUseAuthStore = jest.fn();
  mockUseAuthStore.setState = jest.fn();
  mockUseAuthStore.getState = jest.fn();

  return {
    useAuthStore: mockUseAuthStore,
    clearUserProfileCache: jest.fn(),
    updateCachedUserProfile: jest.fn(),
  };
});

jest.mock('store/useFollowingStore', () => ({
  useFollowingStore: jest.fn(),
}));

jest.mock('components/ui', () => ({
  SuccessToast: ({ open, message }: { open: boolean; message: string }) =>
    open ? <div>{message}</div> : null,
}));

let SettingsPage: typeof import('../page').default;

const mockUseRouter = useRouter as jest.Mock;
const mockSignOut = signOut as jest.Mock;
const mockUseAuthStore = useAuthStore as unknown as jest.Mock & {
  setState: jest.Mock;
  getState: jest.Mock;
};
const mockUpdateCachedUserProfile = updateCachedUserProfile as jest.Mock;
const mockUseFollowingStore = useFollowingStore as unknown as jest.Mock;
const mockResetFollowing = jest.fn();
const mockFetchUserProfile = jest.fn();
const mockReplace = jest.fn();
const mockPush = jest.fn();

const mockUser = {
  uid: 'user-123',
  getIdToken: jest.fn().mockResolvedValue('id-token-abc'),
};

const mockUserProfile = {
  userId: 'user-123',
  username: 'mariame_kaba',
  userType: 'Organizer',
  email: 'user@example.com',
};

describe('SettingsPage delete flow', () => {
  beforeAll(async () => {
    ({ default: SettingsPage } = await import('../page'));
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });

    mockUseAuthStore.mockImplementation(
      (selector: (state: unknown) => unknown) =>
        selector({
          status: 'authenticated',
          user: mockUser,
          userProfile: mockUserProfile,
          fetchUserProfile: mockFetchUserProfile,
        })
    );
    mockUseAuthStore.getState.mockReturnValue({
      fetchUserProfile: mockFetchUserProfile,
    });

    mockUseFollowingStore.mockImplementation(
      (selector: (state: unknown) => unknown) =>
        selector({
          reset: mockResetFollowing,
        })
    );

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn(),
    }) as jest.Mock;
  });

  it('resets profile and following state when deleting the account', async () => {
    render(<SettingsPage />);

    fireEvent.click(screen.getByRole('button', { name: /account/i }));
    fireEvent.click(screen.getByRole('button', { name: /^delete account$/i }));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `${TEST_USERS_API_BASE_URL}/v1/users/user-123`,
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    await waitFor(() => {
      expect(mockResetFollowing).toHaveBeenCalledTimes(1);
      expect(clearUserProfileCache).toHaveBeenCalledWith('user-123');
      expect(mockUseAuthStore.setState).toHaveBeenCalledWith({
        userProfile: null,
        userProfileStatus: 'idle',
      });
      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith('/auth/signin');
    });
  });

  it('updates cached profile settings after successful notification PATCH', async () => {
    render(<SettingsPage />);

    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
    fireEvent.click(
      screen.getByRole('switch', { name: /email notifications/i })
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `${TEST_USERS_API_BASE_URL}/v1/users/user-123`,
        expect.objectContaining({ method: 'PATCH' })
      );
    });

    expect(mockUpdateCachedUserProfile).toHaveBeenCalledWith('user-123', {
      settings: {
        emailNotificationEnabled: true,
      },
    });
  });
});
