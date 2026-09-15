import { act, renderHook, waitFor } from '@testing-library/react';
import { useFridgeNotifications } from '../useFridgeNotifications';
import {
  getFridgeNotifications,
  saveFridgeNotifications,
  deleteFridgeNotifications,
} from '../../utils/fridgeNotificationsApi';
import { useAuthStore } from 'store/useAuthStore';
import { useFollowingStore } from 'store/useFollowingStore';

jest.mock('../../utils/fridgeNotificationsApi', () => ({
  getFridgeNotifications: jest.fn(),
  saveFridgeNotifications: jest.fn(),
  deleteFridgeNotifications: jest.fn(),
}));

jest.mock('store/useAuthStore', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('store/useFollowingStore', () => ({
  useFollowingStore: Object.assign(jest.fn(), {
    getState: jest.fn(),
    setState: jest.fn(),
  }),
}));

const mockGetFridgeNotifications = getFridgeNotifications as jest.Mock;
const mockSaveFridgeNotifications = saveFridgeNotifications as jest.Mock;
const mockDeleteFridgeNotifications = deleteFridgeNotifications as jest.Mock;
const mockUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockUseFollowingStore = useFollowingStore as unknown as {
  getState: jest.Mock;
  setState: jest.Mock;
};
const mockFetchFollowing = jest.fn().mockResolvedValue(undefined);

const mockUser = {
  uid: 'user-1',
  getIdToken: jest.fn().mockResolvedValue('token-1'),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseFollowingStore.getState.mockReturnValue({
    fetch: mockFetchFollowing,
  });
  mockUseFollowingStore.setState.mockImplementation(() => undefined);
});

describe('useFridgeNotifications', () => {
  it('resets state when no authenticated user exists', async () => {
    mockUseAuthStore.mockImplementation(
      (selector: (s: { user: null }) => unknown) => selector({ user: null })
    );

    const { result } = renderHook(() => useFridgeNotifications('fridge-1'));

    await waitFor(() => {
      expect(result.current.isInitializing).toBe(false);
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.isFollowing).toBe(false);
    expect(result.current.savedPreferences).toBeNull();
    expect(mockGetFridgeNotifications).not.toHaveBeenCalled();
  });

  it('loads existing preferences and marks user as following', async () => {
    mockUseAuthStore.mockImplementation(
      (selector: (s: { user: typeof mockUser }) => unknown) =>
        selector({ user: mockUser })
    );

    const prefs = {
      userId: 'user-1',
      fridgeId: 'fridge-1',
      contactTypePreferences: { email: true, text: false },
    };
    mockGetFridgeNotifications.mockResolvedValue(prefs);

    const { result } = renderHook(() => useFridgeNotifications('fridge-1'));

    await waitFor(() => {
      expect(result.current.isInitializing).toBe(false);
    });

    expect(mockGetFridgeNotifications).toHaveBeenCalledWith(
      'user-1',
      'fridge-1',
      'token-1'
    );
    expect(result.current.status).toBe('idle');
    expect(result.current.isFollowing).toBe(true);
    expect(result.current.savedPreferences).toEqual(prefs);
  });

  it('saves new preferences with POST when not following', async () => {
    mockUseAuthStore.mockImplementation(
      (selector: (s: { user: typeof mockUser }) => unknown) =>
        selector({ user: mockUser })
    );
    mockGetFridgeNotifications.mockResolvedValue(null);
    mockSaveFridgeNotifications.mockResolvedValue(undefined);

    const { result } = renderHook(() => useFridgeNotifications('fridge-1'));

    await waitFor(() => {
      expect(result.current.isInitializing).toBe(false);
    });

    await act(async () => {
      await result.current.save({ email: true, text: true });
    });

    expect(mockSaveFridgeNotifications).toHaveBeenCalledWith(
      'user-1',
      'fridge-1',
      'token-1',
      { email: true, text: true },
      'POST'
    );
    expect(result.current.isFollowing).toBe(true);
    expect(result.current.status).toBe('success');
    expect(mockUseFollowingStore.setState).toHaveBeenCalledTimes(1);
    expect(mockFetchFollowing).toHaveBeenCalledWith();
  });

  it('unfollows and clears saved preferences', async () => {
    mockUseAuthStore.mockImplementation(
      (selector: (s: { user: typeof mockUser }) => unknown) =>
        selector({ user: mockUser })
    );
    mockGetFridgeNotifications.mockResolvedValue({
      userId: 'user-1',
      fridgeId: 'fridge-1',
      contactTypePreferences: { email: true, text: false },
    });
    mockDeleteFridgeNotifications.mockResolvedValue(undefined);

    const { result } = renderHook(() => useFridgeNotifications('fridge-1'));

    await waitFor(() => {
      expect(result.current.isInitializing).toBe(false);
    });

    await act(async () => {
      await result.current.unfollow();
    });

    expect(mockDeleteFridgeNotifications).toHaveBeenCalledWith(
      'user-1',
      'fridge-1',
      'token-1'
    );
    expect(result.current.isFollowing).toBe(false);
    expect(result.current.savedPreferences).toBeNull();
    expect(result.current.status).toBe('idle');
    expect(mockUseFollowingStore.setState).toHaveBeenCalledTimes(1);
    expect(mockFetchFollowing).toHaveBeenCalledWith();
  });
});
