import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MyFridgesPage } from '../MyFridgesPage';
import { useAuthStore } from 'store/useAuthStore';
import { useFridgeStore } from 'store/useFridgeStore';
import { useFollowingStore } from 'store/useFollowingStore';
import { Fridge } from 'types/domain';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

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

jest.mock('theme/icons', () => ({
  MapLegendConditionDirtyIcon: () => null,
  MapLegendConditionOutOfOrderIcon: () => null,
  MapLegendPinLocationIcon: () => null,
  MapLegendPinNotAtLocationIcon: () => null,
  MapLegendPinGhostIcon: () => null,
  MapLegendPinNoReportIcon: () => null,
}));

jest.mock('store/useAuthStore', () => ({ useAuthStore: jest.fn() }));
jest.mock('store/useFridgeStore', () => ({ useFridgeStore: jest.fn() }));
jest.mock('store/useFollowingStore', () => ({ useFollowingStore: jest.fn() }));

// ---------------------------------------------------------------------------
// Typed mock references
// ---------------------------------------------------------------------------

const mockUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockUseFridgeStore = useFridgeStore as unknown as jest.Mock;
const mockUseFollowingStore = useFollowingStore as unknown as jest.Mock;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockUser = {
  uid: 'user-1',
  getIdToken: jest.fn().mockResolvedValue('token-123'),
};

const baseFridge: Fridge = {
  id: 'fridge-1',
  name: 'Test Fridge',
  verified: true,
  location: {
    street: '123 Main St',
    city: 'Brooklyn',
    state: 'NY',
    zip: '11201',
    geoLat: 40.7,
    geoLng: -74.0,
  },
  maintainer: {},
  report: {
    fridgeId: 'fridge-1',
    timestamp: '2024-01-15T10:30:00.000Z',
    condition: 'good',
    foodPercentage: 2,
  },
};

const mockNotification = {
  userId: 'user-1',
  fridgeId: 'fridge-1',
  contactTypePreferences: {},
};

const mockFetchFridges = jest.fn().mockResolvedValue(undefined);
const mockFetchFollowing = jest.fn().mockResolvedValue(undefined);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setupStores({
  authStatus = 'authenticated' as const,
  user = mockUser as typeof mockUser | null,
  fridgeStatus = 'success' as string,
  notifStatus = 'success' as string,
  notifications = [mockNotification],
  getFridgeById = jest.fn().mockReturnValue(baseFridge),
} = {}) {
  mockUseAuthStore.mockReturnValue({ user, status: authStatus });
  mockUseFridgeStore.mockReturnValue({
    status: fridgeStatus,
    fetchFridges: mockFetchFridges,
    getFridgeById,
  });
  mockUseFollowingStore.mockReturnValue({
    notifications,
    status: notifStatus,
    fetch: mockFetchFollowing,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUser.getIdToken.mockResolvedValue('token-123');
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MyFridgesPage', () => {
  describe('auth loading state', () => {
    it('renders loading skeletons while auth status is loading', () => {
      setupStores({ authStatus: 'loading', user: null });
      const { container } = render(<MyFridgesPage />);

      expect(
        container.querySelectorAll('.MuiSkeleton-root').length
      ).toBeGreaterThan(0);
    });
  });

  describe('unauthenticated state', () => {
    it('renders a sign-in empty state when the user is not authenticated', () => {
      setupStores({ authStatus: 'unauthenticated', user: null });

      render(<MyFridgesPage />);

      expect(
        screen.getByText(/sign in to view fridges you follow/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /sign in/i })
      ).toBeInTheDocument();
    });
  });

  describe('data loading state', () => {
    it('renders loading skeletons while fridge data is still loading', () => {
      setupStores({ fridgeStatus: 'loading' });
      const { container } = render(<MyFridgesPage />);

      expect(
        container.querySelectorAll('.MuiSkeleton-root').length
      ).toBeGreaterThan(0);
    });

    it('renders loading skeletons while notifications have not resolved', () => {
      setupStores({ notifStatus: 'loading' });
      const { container } = render(<MyFridgesPage />);

      expect(
        container.querySelectorAll('.MuiSkeleton-root').length
      ).toBeGreaterThan(0);
    });
  });

  describe('empty state', () => {
    it('shows the browse CTA when the user follows no fridges', async () => {
      setupStores({
        notifications: [],
        getFridgeById: jest.fn().mockReturnValue(undefined),
      });

      render(<MyFridgesPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/not following any fridges yet/i)
        ).toBeInTheDocument();
      });
      expect(
        screen.getByRole('link', { name: /find fridges near you/i })
      ).toBeInTheDocument();
    });
  });

  describe('populated fridge list', () => {
    it('renders the fridge name when a followed fridge is loaded', async () => {
      setupStores();

      render(<MyFridgesPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Fridge')).toBeInTheDocument();
      });
    });

    it('shows the "Find More Fridges" button when the list is populated', async () => {
      setupStores();

      render(<MyFridgesPage />);

      await waitFor(() => {
        expect(
          screen.getByRole('link', { name: /find more fridges/i })
        ).toBeInTheDocument();
      });
    });

    it('shows the fridge street address', async () => {
      setupStores();

      render(<MyFridgesPage />);

      await waitFor(() => {
        expect(screen.getByText('123 Main St, Brooklyn')).toBeInTheDocument();
      });
    });
  });

  describe('ConditionBadge', () => {
    it('shows "Needs Cleaning" for a fridge with dirty condition', async () => {
      const dirtyFridge: Fridge = {
        ...baseFridge,
        report: { ...baseFridge.report!, condition: 'dirty' },
      };
      setupStores({ getFridgeById: jest.fn().mockReturnValue(dirtyFridge) });

      render(<MyFridgesPage />);

      await waitFor(() => {
        expect(screen.getByText('Needs Cleaning')).toBeInTheDocument();
      });
    });

    it('shows "Needs Repairs" for a fridge with out of order condition', async () => {
      const outOfOrderFridge: Fridge = {
        ...baseFridge,
        report: { ...baseFridge.report!, condition: 'out of order' },
      };
      setupStores({
        getFridgeById: jest.fn().mockReturnValue(outOfOrderFridge),
      });

      render(<MyFridgesPage />);

      await waitFor(() => {
        expect(screen.getByText('Needs Repairs')).toBeInTheDocument();
      });
    });

    it('does not show a condition badge for a fridge with good condition', async () => {
      setupStores(); // baseFridge has condition: 'good'

      render(<MyFridgesPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Fridge')).toBeInTheDocument();
      });

      expect(screen.queryByText('Needs Cleaning')).not.toBeInTheDocument();
      expect(screen.queryByText('Needs Repairs')).not.toBeInTheDocument();
      expect(screen.queryByText('Not at Location')).not.toBeInTheDocument();
    });

    it('does not show a condition badge for an unknown condition', async () => {
      const unknownConditionFridge: Fridge = {
        ...baseFridge,
        report: { ...baseFridge.report!, condition: 'moldy' },
      };
      setupStores({
        getFridgeById: jest.fn().mockReturnValue(unknownConditionFridge),
      });

      render(<MyFridgesPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Fridge')).toBeInTheDocument();
      });

      // Unknown conditions return null — no label rendered
      expect(screen.queryByText('moldy')).not.toBeInTheDocument();
    });
  });

  describe('no report state', () => {
    it('shows "No status" when the fridge has no report', async () => {
      const noReportFridge: Fridge = { ...baseFridge, report: null };
      setupStores({ getFridgeById: jest.fn().mockReturnValue(noReportFridge) });

      render(<MyFridgesPage />);

      await waitFor(() => {
        expect(screen.getByText('No status')).toBeInTheDocument();
      });
    });
  });
});
