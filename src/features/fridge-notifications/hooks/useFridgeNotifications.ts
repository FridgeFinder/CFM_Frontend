import { useState, useEffect } from 'react';
import { useAuthStore } from 'store/useAuthStore';
import { useFollowingStore } from 'store/useFollowingStore';
import {
  UserFridgeNotification,
  ContactTypePreferences,
  AppStatus,
} from 'types/domain';
import {
  getFridgeNotifications,
  saveFridgeNotifications,
  deleteFridgeNotifications,
} from '../utils/fridgeNotificationsApi';

interface UseFridgeNotificationsResult {
  status: AppStatus;
  isInitializing: boolean;
  isFollowing: boolean;
  savedPreferences: UserFridgeNotification | null;
  error: string | null;
  save: (preferences: ContactTypePreferences) => Promise<boolean>;
  unfollow: () => Promise<boolean>;
}

export function useFridgeNotifications(
  fridgeId: string
): UseFridgeNotificationsResult {
  const user = useAuthStore((s) => s.user);
  const [status, setStatus] = useState<AppStatus>('loading');
  const [isInitializing, setIsInitializing] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [savedPreferences, setSavedPreferences] =
    useState<UserFridgeNotification | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setStatus('idle');
      setIsFollowing(false);
      setSavedPreferences(null);
      setIsInitializing(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setIsInitializing(true);
        setStatus('loading');
        const idToken = await user!.getIdToken();
        const prefs = await getFridgeNotifications(
          user!.uid,
          fridgeId,
          idToken
        );
        if (cancelled) return;
        setIsFollowing(prefs !== null);
        setSavedPreferences(prefs);
        setStatus('idle');
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : 'Failed to load notifications'
        );
        setStatus('error');
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user, fridgeId]);

  async function save(preferences: ContactTypePreferences): Promise<boolean> {
    if (!user) {
      setError('You must be signed in to save notifications');
      return false;
    }
    try {
      setStatus('loading');
      setError(null);
      const idToken = await user.getIdToken();
      const method = isFollowing ? 'PATCH' : 'POST';
      await saveFridgeNotifications(
        user.uid,
        fridgeId,
        idToken,
        preferences,
        method
      );
      const savedNotification: UserFridgeNotification = {
        userId: user.uid,
        fridgeId,
        contactTypePreferences: preferences,
      };

      // Optimistically update shared following cache for immediate UI feedback.
      useFollowingStore.setState((state) => {
        const existingIndex = state.notifications.findIndex(
          (notification) => notification.fridgeId === fridgeId
        );

        const notifications = [...state.notifications];
        if (existingIndex >= 0) {
          notifications[existingIndex] = savedNotification;
        } else {
          notifications.push(savedNotification);
        }

        return {
          notifications,
          status: notifications.length > 0 ? 'success' : 'empty',
          ownerUserId: user.uid,
        };
      });

      setIsFollowing(true);
      setSavedPreferences(savedNotification);
      // Revalidate in the background without blocking immediate optimistic UI.
      void useFollowingStore.getState().fetch();
      setStatus('success');
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save notifications'
      );
      setStatus('error');
      return false;
    }
  }

  async function unfollow(): Promise<boolean> {
    if (!user) {
      setError('You must be signed in to unfollow');
      return false;
    }
    try {
      setStatus('loading');
      setError(null);
      const idToken = await user.getIdToken();
      await deleteFridgeNotifications(user.uid, fridgeId, idToken);

      // Optimistically update shared following cache for immediate UI feedback.
      useFollowingStore.setState((state) => {
        const notifications = state.notifications.filter(
          (notification) => notification.fridgeId !== fridgeId
        );

        return {
          notifications,
          status: notifications.length > 0 ? 'success' : 'empty',
          ownerUserId: user.uid,
        };
      });

      setIsFollowing(false);
      setSavedPreferences(null);
      // Revalidate in the background without blocking immediate optimistic UI.
      void useFollowingStore.getState().fetch();
      setStatus('idle');
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to unfollow fridge'
      );
      setStatus('error');
      return false;
    }
  }

  return {
    status,
    isInitializing,
    isFollowing,
    savedPreferences,
    error,
    save,
    unfollow,
  };
}
