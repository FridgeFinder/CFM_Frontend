import type { User } from 'firebase/auth';
import { getIdTokenResult, onAuthStateChanged } from 'firebase/auth';

const TEST_USERS_API_URL = 'https://users-api-fake.test.com';
process.env.NEXT_PUBLIC_USERS_API_URL = TEST_USERS_API_URL;

jest.mock('config/firebase', () => ({
  getFirebaseAuth: jest.fn(() => ({})),
}));

jest.mock('firebase/auth', () => ({
  getIdTokenResult: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

let useAuthStore: typeof import('../useAuthStore').useAuthStore;
let clearUserProfileCache: typeof import('../useAuthStore').clearUserProfileCache;
let updateCachedUserProfile: typeof import('../useAuthStore').updateCachedUserProfile;
let initAuthListener: typeof import('../useAuthStore').initAuthListener;

const mockUser = {
  uid: 'user-123',
  getIdToken: jest.fn().mockResolvedValue('id-token-abc'),
} as unknown as User;

const profileResponse = {
  user: {
    userId: 'user-123',
    userType: 'Organizer',
    username: 'mariame_kaba',
    email: 'user@example.com',
  },
};

describe('useAuthStore profile cache', () => {
  beforeAll(async () => {
    ({
      useAuthStore,
      clearUserProfileCache,
      updateCachedUserProfile,
      initAuthListener,
    } = await import('../useAuthStore'));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      user: mockUser,
      status: 'authenticated',
      isAdmin: false,
      customClaimsStatus: 'idle',
      userProfile: null,
      userProfileStatus: 'idle',
    });
    clearUserProfileCache('user-123');
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(profileResponse),
    }) as jest.Mock;
  });

  afterEach(() => {
    clearUserProfileCache('user-123');
  });

  it('reuses the cached profile until the cache is cleared', async () => {
    await useAuthStore.getState().fetchUserProfile(mockUser);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().userProfile).toEqual(profileResponse.user);
    expect(useAuthStore.getState().userProfileStatus).toBe('success');

    await useAuthStore.getState().fetchUserProfile(mockUser);

    expect(global.fetch).toHaveBeenCalledTimes(1);

    clearUserProfileCache('user-123');

    await useAuthStore.getState().fetchUserProfile(mockUser);

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(useAuthStore.getState().userProfile).toEqual(profileResponse.user);
    expect(useAuthStore.getState().userProfileStatus).toBe('success');
  });

  it('updates cached and active profile when userType changes', async () => {
    await useAuthStore.getState().fetchUserProfile(mockUser);

    updateCachedUserProfile('user-123', { userType: 'Volunteer' });

    expect(useAuthStore.getState().userProfile?.userType).toBe('Volunteer');

    useAuthStore.setState({ userProfile: null, userProfileStatus: 'idle' });
    await useAuthStore.getState().fetchUserProfile(mockUser);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().userProfile?.userType).toBe('Volunteer');
  });

  it('loads and resets the admin custom claim from auth changes', async () => {
    const authStateChanged = onAuthStateChanged as jest.Mock;
    const getTokenResult = getIdTokenResult as jest.Mock;
    let handleAuthChange: ((user: User | null) => void) | undefined;

    authStateChanged.mockImplementation(
      (_auth: unknown, callback: (user: User | null) => void) => {
        handleAuthChange = callback;
        return jest.fn();
      }
    );
    getTokenResult.mockResolvedValue({ claims: { admin: true } });

    initAuthListener();
    handleAuthChange?.(mockUser);

    expect(useAuthStore.getState().customClaimsStatus).toBe('loading');

    await Promise.resolve();

    expect(getTokenResult).toHaveBeenCalledWith(mockUser);
    expect(useAuthStore.getState().isAdmin).toBe(true);
    expect(useAuthStore.getState().customClaimsStatus).toBe('success');

    handleAuthChange?.(null);

    expect(useAuthStore.getState().isAdmin).toBe(false);
    expect(useAuthStore.getState().customClaimsStatus).toBe('idle');
  });
});
