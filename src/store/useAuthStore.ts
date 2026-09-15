import { create } from 'zustand';
import { User, onAuthStateChanged } from 'firebase/auth';
import { getFirebaseAuth } from 'config/firebase';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';
type UserProfileStatus = 'idle' | 'loading' | 'success' | 'error';

const USERS_API_URL = process.env.NEXT_PUBLIC_USERS_API_URL;

export interface AppUserProfile {
  userId: string;
  userType: string;
  username: string;
  email?: string;
  phoneNumber?: string;
  zipcode?: string;
  points?: number;
  settings?: {
    emailNotificationEnabled?: boolean;
    // Used by native clients; web does not currently render this setting.
    geofenceEnabled?: boolean;
  };
}

const userProfileCache = new Map<string, AppUserProfile>();
const inFlightProfileRequests = new Map<
  string,
  Promise<AppUserProfile | null>
>();

export const clearUserProfileCache = (userId: string): void => {
  userProfileCache.delete(userId);
  inFlightProfileRequests.delete(userId);
};

export const updateCachedUserProfile = (
  userId: string,
  updates: Partial<AppUserProfile>
): void => {
  const cachedProfile = userProfileCache.get(userId);
  const activeProfile = useAuthStore.getState().userProfile;
  const activeUserId = useAuthStore.getState().user?.uid;

  if (cachedProfile) {
    userProfileCache.set(userId, { ...cachedProfile, ...updates });
  } else if (activeUserId === userId && activeProfile) {
    userProfileCache.set(userId, { ...activeProfile, ...updates });
  }

  if (activeUserId === userId && activeProfile) {
    useAuthStore.setState({
      userProfile: { ...activeProfile, ...updates },
    });
  }
};

type LoadUserProfileResult =
  | { profile: AppUserProfile; status: 'success' }
  | { profile: null; status: 'not-found' }
  | { profile: null; status: 'error' };

async function loadUserProfile(user: User): Promise<LoadUserProfileResult> {
  if (!USERS_API_URL) {
    console.error('[useAuthStore] NEXT_PUBLIC_USERS_API_URL is not set');
    return { profile: null, status: 'error' };
  }

  const cachedProfile = userProfileCache.get(user.uid);
  if (cachedProfile) {
    return { profile: cachedProfile, status: 'success' };
  }

  const existingRequest = inFlightProfileRequests.get(user.uid);
  if (existingRequest) {
    const existingProfile = await existingRequest;
    if (existingProfile) {
      return { profile: existingProfile, status: 'success' };
    }

    return { profile: null, status: 'not-found' };
  }

  const request = (async () => {
    const idToken = await user.getIdToken();
    const response = await fetch(`${USERS_API_URL}/v1/users/${user.uid}`, {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(
        `[useAuthStore] Failed to load user profile ${response.status}: ${response.statusText}`
      );
    }

    const data = (await response.json()) as { user?: AppUserProfile };
    if (!data.user) {
      return null;
    }

    userProfileCache.set(user.uid, data.user);
    return data.user;
  })();

  inFlightProfileRequests.set(user.uid, request);
  try {
    const profile = await request;
    if (profile) {
      return { profile, status: 'success' };
    }

    return { profile: null, status: 'not-found' };
  } catch (error) {
    console.error('[useAuthStore] Failed to load user profile', error);
    return { profile: null, status: 'error' };
  } finally {
    inFlightProfileRequests.delete(user.uid);
  }
}

interface AuthState {
  user: User | null;
  status: AuthStatus;
  userProfile: AppUserProfile | null;
  userProfileStatus: UserProfileStatus;
  fetchUserProfile: (user: User) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'loading',
  userProfile: null,
  userProfileStatus: 'idle',
  fetchUserProfile: async (user: User) => {
    const cachedProfile = userProfileCache.get(user.uid);
    if (cachedProfile) {
      set({ userProfile: cachedProfile, userProfileStatus: 'success' });
      return;
    }

    set({ userProfileStatus: 'loading' });
    const result = await loadUserProfile(user);

    if (result.status === 'not-found') {
      set({ userProfile: null, userProfileStatus: 'idle' });
      return;
    }

    if (useAuthStore.getState().user?.uid !== user.uid) {
      return;
    }

    set({
      userProfile: result.profile,
      userProfileStatus: result.status,
    });
  },
}));

export const initAuthListener = (): (() => void) => {
  const auth = getFirebaseAuth();

  return onAuthStateChanged(auth, (user) => {
    if (!user) {
      useAuthStore.setState({
        user: null,
        status: 'unauthenticated',
        userProfile: null,
        userProfileStatus: 'idle',
      });
      return;
    }

    const cachedProfile = userProfileCache.get(user.uid) ?? null;
    useAuthStore.setState({
      user,
      status: 'authenticated',
      userProfile: cachedProfile,
      userProfileStatus: cachedProfile ? 'success' : 'loading',
    });

    void useAuthStore.getState().fetchUserProfile(user);
  });
};
