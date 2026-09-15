import { create } from 'zustand';
import { UserFridgeNotification, AppStatus } from 'types/domain';
import { getAllUserNotifications } from 'features/fridge-notifications/utils/fridgeNotificationsApi';
import { useAuthStore } from './useAuthStore';

interface FollowingState {
  notifications: UserFridgeNotification[];
  status: AppStatus;
  ownerUserId: string | null;

  fetch: () => Promise<void>;
  reset: () => void;
}

let isFetching = false;

export const useFollowingStore = create<FollowingState>((set, get) => ({
  notifications: [],
  status: 'idle',
  ownerUserId: null,

  fetch: async () => {
    const { ownerUserId } = get();

    const user = useAuthStore.getState().user;
    if (!user) {
      set({
        notifications: [],
        status: 'idle',
        ownerUserId: null,
      });
      isFetching = false;
      return;
    }

    const requestUserId = user.uid;

    if (ownerUserId !== null && ownerUserId !== user.uid) {
      set({
        notifications: [],
        status: 'idle',
        ownerUserId: user.uid,
      });
    }

    // In-flight guard: deduplicate concurrent calls
    if (isFetching) return;
    isFetching = true;

    const { notifications } = get();

    if (notifications.length === 0) {
      set({ status: 'loading' });
    }

    try {
      const idToken = await user.getIdToken();

      const latestUserBeforeFetch = useAuthStore.getState().user;
      if (
        !latestUserBeforeFetch ||
        latestUserBeforeFetch.uid !== requestUserId
      ) {
        return;
      }

      const data = await getAllUserNotifications(requestUserId, idToken);

      const latestUserBeforeCommit = useAuthStore.getState().user;
      if (
        !latestUserBeforeCommit ||
        latestUserBeforeCommit.uid !== requestUserId
      ) {
        return;
      }

      set({
        notifications: data,
        status: data.length > 0 ? 'success' : 'empty',
        ownerUserId: requestUserId,
      });
    } catch {
      const latestUserOnError = useAuthStore.getState().user;
      if (!latestUserOnError || latestUserOnError.uid !== requestUserId) {
        return;
      }

      if (get().notifications.length === 0) {
        set({ status: 'error' });
      }
    } finally {
      isFetching = false;
    }
  },

  reset: () =>
    set({
      notifications: [],
      status: 'idle',
      ownerUserId: null,
    }),
}));
