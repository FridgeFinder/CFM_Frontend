import type { User } from 'firebase/auth';

const mockUpdateCachedUserProfile = jest.fn();

jest.mock('store/useAuthStore', () => ({
  updateCachedUserProfile: (...args: unknown[]) =>
    mockUpdateCachedUserProfile(...args),
}));

const TEST_API_URL = 'http://test-users-api';

function makeUser(
  overrides: {
    uid?: string;
    idToken?: string;
  } = {}
): User {
  return {
    uid: overrides.uid ?? 'uid-123',
    getIdToken: jest
      .fn()
      .mockResolvedValue(overrides.idToken ?? 'id-token-abc'),
  } as unknown as User;
}

describe('promoteNeighborToVolunteer (URL set)', () => {
  let promoteNeighborToVolunteer: (
    user: User | null,
    userType?: string
  ) => Promise<void>;

  beforeEach(() => {
    mockUpdateCachedUserProfile.mockReset();
    process.env.NEXT_PUBLIC_USERS_API_URL = TEST_API_URL;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      ({
        promoteNeighborToVolunteer,
      } = require('../promoteNeighborToVolunteer'));
    });
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, status: 200, statusText: 'OK' });
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('PATCHes userType=Volunteer for Neighbor users', async () => {
    await promoteNeighborToVolunteer(makeUser({ uid: 'uid-1' }), 'Neighbor');

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_API_URL}/v1/users/uid-1`,
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ userType: 'Volunteer' }),
      })
    );

    expect(mockUpdateCachedUserProfile).toHaveBeenCalledWith('uid-1', {
      userType: 'Volunteer',
    });
  });

  it('sends Authorization header with Bearer id token', async () => {
    await promoteNeighborToVolunteer(
      makeUser({ idToken: 'abc-123' }),
      'Neighbor'
    );

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer abc-123',
        }),
      })
    );
  });

  it('does not call fetch when userType is not Neighbor', async () => {
    await promoteNeighborToVolunteer(makeUser({}), 'Volunteer');

    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not call fetch when user is null', async () => {
    await promoteNeighborToVolunteer(null, 'Neighbor');

    expect(fetch).not.toHaveBeenCalled();
  });

  it('logs API errors for non-ok responses', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

    await promoteNeighborToVolunteer(makeUser({}), 'Neighbor');

    expect(console.error).toHaveBeenCalledWith(
      '[promoteNeighborToVolunteer] API error 500: Internal Server Error'
    );
    expect(mockUpdateCachedUserProfile).not.toHaveBeenCalled();
  });

  it('logs network errors when fetch throws', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network failure'));

    await promoteNeighborToVolunteer(makeUser({}), 'Neighbor');

    expect(console.error).toHaveBeenCalledWith(
      '[promoteNeighborToVolunteer] Network error:',
      expect.any(Error)
    );
  });
});

describe('promoteNeighborToVolunteer (URL not set)', () => {
  let promoteNeighborToVolunteer: (
    user: User | null,
    userType?: string
  ) => Promise<void>;

  beforeEach(() => {
    mockUpdateCachedUserProfile.mockReset();
    delete process.env.NEXT_PUBLIC_USERS_API_URL;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      ({
        promoteNeighborToVolunteer,
      } = require('../promoteNeighborToVolunteer'));
    });
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_USERS_API_URL = TEST_API_URL;
    jest.restoreAllMocks();
  });

  it('does not call fetch', async () => {
    await promoteNeighborToVolunteer(makeUser({}), 'Neighbor');

    expect(fetch).not.toHaveBeenCalled();
    expect(mockUpdateCachedUserProfile).not.toHaveBeenCalled();
  });
});
