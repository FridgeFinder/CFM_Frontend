import { useFridgeStore } from '../useFridgeStore';
import { apiClient } from 'utils/api-client';
import type { ApiFridge, Fridge } from 'types/domain';

jest.mock('utils/api-client', () => ({
  apiClient: { getFridges: jest.fn() },
}));

const mockGetFridges = apiClient.getFridges as jest.Mock;

const mockApiFridge: ApiFridge = {
  id: 'fridge-1',
  name: 'Test Fridge',
  verified: false,
  location: {
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    zip: '10001',
    geoLat: 40.7128,
    geoLng: -74.006,
  },
  maintainer: {},
};

// The transformed shape stored in state (latestFridgeReport → report)
const mockFridge: Fridge = { ...mockApiFridge, report: null };

const INITIAL_STATE = {
  fridges: [] as Fridge[],
  status: 'idle' as const,
  error: null,
  lastUpdated: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  useFridgeStore.setState(INITIAL_STATE);
});

// ---------------------------------------------------------------------------
// Basic fetch behaviour
// ---------------------------------------------------------------------------

describe('fetchFridges — basic behaviour', () => {
  it('shows loading skeleton when there are no cached fridges', async () => {
    let resolveFirst!: (value: ApiFridge[]) => void;
    mockGetFridges.mockReturnValueOnce(
      new Promise<ApiFridge[]>((r) => {
        resolveFirst = r;
      })
    );

    const fetchPromise = useFridgeStore.getState().fetchFridges();
    expect(useFridgeStore.getState().status).toBe('loading');

    resolveFirst([]);
    await fetchPromise;
  });

  it('does not flash loading skeleton when refetching with cached data', async () => {
    // Invalidated cache (lastUpdated: null) but fridges are present
    useFridgeStore.setState({
      fridges: [mockFridge],
      status: 'success',
      lastUpdated: null,
    });

    let resolveFirst!: (value: ApiFridge[]) => void;
    mockGetFridges.mockReturnValueOnce(
      new Promise<ApiFridge[]>((r) => {
        resolveFirst = r;
      })
    );

    const fetchPromise = useFridgeStore.getState().fetchFridges();
    // Status must stay 'success' — no skeleton flash
    expect(useFridgeStore.getState().status).toBe('success');

    resolveFirst([mockApiFridge]);
    await fetchPromise;
  });

  it('stores transformed fridges and sets status to success', async () => {
    const withReport: ApiFridge = {
      ...mockApiFridge,
      latestFridgeReport: {
        fridgeId: 'fridge-1',
        timestamp: '2024-01-01T00:00:00Z',
        condition: 'good',
        foodPercentage: 2,
      },
    };
    mockGetFridges.mockResolvedValueOnce([withReport]);

    await useFridgeStore.getState().fetchFridges();

    const { fridges, status } = useFridgeStore.getState();
    expect(fridges).toHaveLength(1);
    expect(fridges[0].id).toBe('fridge-1');
    expect(fridges[0].report).toEqual(withReport.latestFridgeReport);
    expect(status).toBe('success');
    expect(useFridgeStore.getState().lastUpdated).not.toBeNull();
  });

  it('sets status to empty when the API returns no fridges', async () => {
    mockGetFridges.mockResolvedValueOnce([]);

    await useFridgeStore.getState().fetchFridges();

    expect(useFridgeStore.getState().status).toBe('empty');
  });

  it('sets status to error and records the message when fetch throws with no cache', async () => {
    mockGetFridges.mockRejectedValueOnce(new Error('Network error'));

    await useFridgeStore.getState().fetchFridges();

    expect(useFridgeStore.getState().status).toBe('error');
    expect(useFridgeStore.getState().error).toBe('Network error');
  });

  it('uses a fallback message when a non-Error is thrown with no cache', async () => {
    mockGetFridges.mockRejectedValueOnce('plain string rejection');

    await useFridgeStore.getState().fetchFridges();

    expect(useFridgeStore.getState().status).toBe('error');
    expect(useFridgeStore.getState().error).toBe('Failed to fetch fridges');
  });

  it('does not change status to error when fetch throws and cached fridges exist', async () => {
    useFridgeStore.setState({
      fridges: [mockFridge],
      status: 'success',
      lastUpdated: null,
    });
    mockGetFridges.mockRejectedValueOnce(new Error('Network error'));

    await useFridgeStore.getState().fetchFridges();

    // Cached list stays visible; error is suppressed
    expect(useFridgeStore.getState().status).toBe('success');
    expect(useFridgeStore.getState().fridges).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// TTL guard
// ---------------------------------------------------------------------------

describe('TTL guard', () => {
  it('skips the network request when data is fresh', async () => {
    useFridgeStore.setState({
      fridges: [mockFridge],
      status: 'success',
      lastUpdated: Date.now(),
    });

    await useFridgeStore.getState().fetchFridges();

    expect(mockGetFridges).not.toHaveBeenCalled();
  });

  it('re-fetches when lastUpdated is null (e.g. after invalidate)', async () => {
    useFridgeStore.setState({
      fridges: [mockFridge],
      status: 'success',
      lastUpdated: null,
    });
    mockGetFridges.mockResolvedValueOnce([mockApiFridge]);

    await useFridgeStore.getState().fetchFridges();

    expect(mockGetFridges).toHaveBeenCalledTimes(1);
  });

  it('re-fetches when data is stale (older than 1 minute)', async () => {
    const TWO_MINUTES_AGO = Date.now() - 2 * 60 * 1000;
    useFridgeStore.setState({
      fridges: [mockFridge],
      status: 'success',
      lastUpdated: TWO_MINUTES_AGO,
    });
    mockGetFridges.mockResolvedValueOnce([mockApiFridge]);

    await useFridgeStore.getState().fetchFridges();

    expect(mockGetFridges).toHaveBeenCalledTimes(1);
  });

  it('skips when data is just within the 1-minute window', async () => {
    const THIRTY_SECONDS_AGO = Date.now() - 30 * 1000;
    useFridgeStore.setState({
      fridges: [mockFridge],
      status: 'success',
      lastUpdated: THIRTY_SECONDS_AGO,
    });

    await useFridgeStore.getState().fetchFridges();

    expect(mockGetFridges).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// In-flight guard
// ---------------------------------------------------------------------------

describe('in-flight guard', () => {
  it('deduplicates concurrent fetchFridges calls — only one network request fires', async () => {
    let resolveFirst!: (value: ApiFridge[]) => void;
    mockGetFridges.mockReturnValueOnce(
      new Promise<ApiFridge[]>((r) => {
        resolveFirst = r;
      })
    );

    const p1 = useFridgeStore.getState().fetchFridges();
    const p2 = useFridgeStore.getState().fetchFridges(); // second call while first is in-flight

    expect(mockGetFridges).toHaveBeenCalledTimes(1);

    resolveFirst([mockApiFridge]);
    await Promise.all([p1, p2]);
  });
});

// ---------------------------------------------------------------------------
// invalidate
// ---------------------------------------------------------------------------

describe('invalidate', () => {
  it('sets lastUpdated to null', () => {
    useFridgeStore.setState({ lastUpdated: Date.now() });

    useFridgeStore.getState().invalidate();

    expect(useFridgeStore.getState().lastUpdated).toBeNull();
  });

  it('causes the next fetchFridges to re-fetch despite having cached data', async () => {
    useFridgeStore.setState({
      fridges: [mockFridge],
      status: 'success',
      lastUpdated: Date.now(),
    });

    useFridgeStore.getState().invalidate();

    mockGetFridges.mockResolvedValueOnce([mockApiFridge]);
    await useFridgeStore.getState().fetchFridges();

    expect(mockGetFridges).toHaveBeenCalledTimes(1);
  });

  it('does not change fridges or status — only clears the TTL marker', () => {
    useFridgeStore.setState({
      fridges: [mockFridge],
      status: 'success',
      lastUpdated: Date.now(),
    });

    useFridgeStore.getState().invalidate();

    expect(useFridgeStore.getState().fridges).toHaveLength(1);
    expect(useFridgeStore.getState().status).toBe('success');
  });
});

// ---------------------------------------------------------------------------
// getFridgeById
// ---------------------------------------------------------------------------

describe('getFridgeById', () => {
  it('returns the matching fridge', () => {
    useFridgeStore.setState({ fridges: [mockFridge] });

    expect(useFridgeStore.getState().getFridgeById('fridge-1')).toEqual(
      mockFridge
    );
  });

  it('returns undefined for an unknown id', () => {
    useFridgeStore.setState({ fridges: [mockFridge] });

    expect(
      useFridgeStore.getState().getFridgeById('does-not-exist')
    ).toBeUndefined();
  });
});

describe('updateFridgeReport', () => {
  it('updates report for a matching fridge id', () => {
    useFridgeStore.setState({ fridges: [mockFridge] });

    const report = {
      fridgeId: 'fridge-1',
      timestamp: '2026-06-15T00:00:00.000Z',
      condition: 'good',
      foodPercentage: 3,
      notes: 'Restocked',
    };

    useFridgeStore.getState().updateFridgeReport('fridge-1', report);

    expect(useFridgeStore.getState().fridges[0].report).toEqual(report);
  });

  it('does nothing when fridge id does not exist', () => {
    useFridgeStore.setState({ fridges: [mockFridge] });

    const report = {
      fridgeId: 'missing-id',
      timestamp: '2026-06-15T00:00:00.000Z',
      condition: 'good',
      foodPercentage: 2,
    };

    useFridgeStore.getState().updateFridgeReport('missing-id', report);

    expect(useFridgeStore.getState().fridges[0].report).toBeNull();
  });
});
