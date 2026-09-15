import { UserFridgeNotification, ContactTypePreferences } from 'types/domain';

const NOTIFICATIONS_API_URL = process.env.NEXT_PUBLIC_NOTIFICATIONS_API_URL;

function notificationsUrl(userId: string, fridgeId: string): string {
  return `${NOTIFICATIONS_API_URL}/v1/users/${userId}/fridge-notifications/${fridgeId}`;
}

function authHeaders(idToken: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${idToken}`,
  };
}

/**
 * Returns null when the user is not yet following the fridge (404).
 */
export async function getFridgeNotifications(
  userId: string,
  fridgeId: string,
  idToken: string
): Promise<UserFridgeNotification | null> {
  if (!NOTIFICATIONS_API_URL) {
    throw new Error('NEXT_PUBLIC_NOTIFICATIONS_API_URL is not set');
  }
  const res = await fetch(notificationsUrl(userId, fridgeId), {
    headers: authHeaders(idToken),
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Failed to fetch notifications: ${res.statusText}`);
  }
  const data = await res.json();
  return data;
}

export async function deleteFridgeNotifications(
  userId: string,
  fridgeId: string,
  idToken: string
): Promise<void> {
  if (!NOTIFICATIONS_API_URL) {
    throw new Error('NEXT_PUBLIC_NOTIFICATIONS_API_URL is not set');
  }
  const res = await fetch(notificationsUrl(userId, fridgeId), {
    method: 'DELETE',
    headers: authHeaders(idToken),
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`Failed to unfollow fridge: ${res.statusText}`);
  }
}

export async function getAllUserNotifications(
  userId: string,
  idToken: string
): Promise<UserFridgeNotification[]> {
  if (!NOTIFICATIONS_API_URL) {
    throw new Error('NEXT_PUBLIC_NOTIFICATIONS_API_URL is not set');
  }
  const res = await fetch(
    `${NOTIFICATIONS_API_URL}/v1/users/${userId}/fridge-notifications`,
    { headers: authHeaders(idToken) }
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch notifications: ${res.statusText}`);
  }
  const data = await res.json();
  return data.notifications ?? [];
}

export async function saveFridgeNotifications(
  userId: string,
  fridgeId: string,
  idToken: string,
  preferences: ContactTypePreferences,
  method: 'POST' | 'PATCH'
): Promise<void> {
  if (!NOTIFICATIONS_API_URL) {
    throw new Error('NEXT_PUBLIC_NOTIFICATIONS_API_URL is not set');
  }
  const body =
    method === 'POST'
      ? { userId, fridgeId, contactTypePreferences: preferences }
      : { contactTypePreferences: preferences };

  const res = await fetch(notificationsUrl(userId, fridgeId), {
    method,
    headers: authHeaders(idToken),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Failed to save notifications: ${res.statusText}`);
  }
}
