import { User } from 'firebase/auth';
import { updateCachedUserProfile } from 'store/useAuthStore';

const USERS_API_URL = process.env.NEXT_PUBLIC_USERS_API_URL;

/**
 * PATCHes the user's email in the users database after it has been
 * verified and linked on the Firebase account.
 */
export async function updateUserEmail(
  user: User,
  email: string
): Promise<void> {
  if (!USERS_API_URL) {
    throw new Error('NEXT_PUBLIC_USERS_API_URL is not set');
  }
  const idToken = await user.getIdToken(/* forceRefresh */ true);
  const res = await fetch(`${USERS_API_URL}/v1/users/${user.uid}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    console.error(
      `[updateUserEmail] API error ${res.status}: ${res.statusText}`
    );
    return;
  }

  updateCachedUserProfile(user.uid, { email });
}
