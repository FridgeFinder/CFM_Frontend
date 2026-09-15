import { User } from 'firebase/auth';
import { updateCachedUserProfile } from 'store/useAuthStore';

/**
 * Promotes a user from Neighbor to Volunteer in the users service.
 * This is intentionally best-effort and should not interrupt parent flows.
 */
export async function promoteNeighborToVolunteer(
  user: User | null,
  userType?: string
): Promise<void> {
  const usersApiUrl = process.env.NEXT_PUBLIC_USERS_API_URL;

  if (!user || userType !== 'Neighbor' || !usersApiUrl) {
    return;
  }

  try {
    const idToken = await user.getIdToken();
    const response = await fetch(`${usersApiUrl}/v1/users/${user.uid}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ userType: 'Volunteer' }),
    });

    if (!response.ok) {
      console.error(
        `[promoteNeighborToVolunteer] API error ${response.status}: ${response.statusText}`
      );
      return;
    }

    updateCachedUserProfile(user.uid, { userType: 'Volunteer' });
  } catch (error) {
    console.error('[promoteNeighborToVolunteer] Network error:', error);
  }
}
