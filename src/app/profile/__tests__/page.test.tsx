import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from 'store/useAuthStore';
import { useFollowingStore } from 'store/useFollowingStore';

const TEST_REWARDS_API_BASE_URL = 'https://user-rewards-api-fake.test.com';
process.env.NEXT_PUBLIC_USER_REWARDS_API_URL = TEST_REWARDS_API_BASE_URL;

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

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

jest.mock('firebase/auth', () => ({}));

jest.mock('config/firebase', () => ({
  getFirebaseAuth: jest.fn(() => ({})),
}));

jest.mock('store/useAuthStore', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('store/useFollowingStore', () => ({
  useFollowingStore: jest.fn(),
}));

let ProfilePage: typeof import('../page').default;

const mockUseRouter = useRouter as jest.Mock;
const mockUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockUseFollowingStore = useFollowingStore as unknown as jest.Mock;
const mockFetchFollowing = jest.fn();
const mockPush = jest.fn();

const mockUser = {
  uid: 'user-123',
};

const mockUserProfile = {
  userId: 'user-123',
  username: 'mariame_kaba',
  userType: 'Organizer',
};

describe('ProfilePage', () => {
  beforeAll(async () => {
    ({ default: ProfilePage } = await import('../page'));
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseRouter.mockReturnValue({ push: mockPush });

    mockUseAuthStore.mockImplementation(
      (selector: (state: unknown) => unknown) =>
        selector({
          status: 'authenticated',
          user: mockUser,
          userProfile: mockUserProfile,
        })
    );

    mockUseFollowingStore.mockImplementation(
      (selector: (state: unknown) => unknown) =>
        selector({
          notifications: [{ fridgeId: 'fridge-1' }, { fridgeId: 'fridge-2' }],
          fetch: mockFetchFollowing,
        })
    );

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        totalPoints: '100',
        fridgeReportCount: '8',
        cleanedCount: '3',
        filledCount: '6',
      }),
    }) as jest.Mock;
  });

  it('renders username, role, and following count from shared stores', async () => {
    render(<ProfilePage />);

    expect(screen.getByText('mariame_kaba')).toBeInTheDocument();
    expect(screen.getByText('Organizer')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /following/i })).toHaveTextContent(
      '2 Following'
    );

    await waitFor(() => {
      expect(mockFetchFollowing).toHaveBeenCalledTimes(1);
    });
  });

  it('fetches and renders user action stats', async () => {
    render(<ProfilePage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `${TEST_REWARDS_API_BASE_URL}/v1/user-action-stats/user-123`
      );
    });

    expect(await screen.findByText('100')).toBeInTheDocument();
    expect(screen.getByText('Points')).toBeInTheDocument();
    expect(screen.getByText('Reported')).toBeInTheDocument();
    expect(screen.getByText('Cleaned')).toBeInTheDocument();
    expect(screen.getByText('Filled')).toBeInTheDocument();
  });

  it('links to the settings page from the gear icon', async () => {
    const { container } = render(<ProfilePage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    expect(container.querySelector('a[href="/settings"]')).toBeInTheDocument();
  });
});
