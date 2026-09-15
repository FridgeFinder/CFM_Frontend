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

describe('updateUserEmail (URL set)', () => {
  let updateUserEmail: (user: User, email: string) => Promise<void>;

  beforeEach(() => {
    mockUpdateCachedUserProfile.mockReset();
    process.env.NEXT_PUBLIC_USERS_API_URL = TEST_API_URL;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      ({ updateUserEmail } = require('../updateUserEmail'));
    });
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, status: 200, statusText: 'OK' });
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('PATCHes email and updates cached profile on success', async () => {
    await updateUserEmail(makeUser({ uid: 'uid-1' }), 'new@example.com');

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_API_URL}/v1/users/uid-1`,
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ email: 'new@example.com' }),
      })
    );
    expect(mockUpdateCachedUserProfile).toHaveBeenCalledWith('uid-1', {
      email: 'new@example.com',
    });
  });

  it('does not update cache when API responds non-ok', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

    await updateUserEmail(makeUser({ uid: 'uid-1' }), 'new@example.com');

    expect(mockUpdateCachedUserProfile).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      '[updateUserEmail] API error 500: Internal Server Error'
    );
  });
});

describe('updateUserEmail (URL not set)', () => {
  let updateUserEmail: (user: User, email: string) => Promise<void>;

  beforeEach(() => {
    mockUpdateCachedUserProfile.mockReset();
    delete process.env.NEXT_PUBLIC_USERS_API_URL;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      ({ updateUserEmail } = require('../updateUserEmail'));
    });
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_USERS_API_URL = TEST_API_URL;
    jest.restoreAllMocks();
  });

  it('throws when API URL is missing', async () => {
    await expect(
      updateUserEmail(makeUser({}), 'new@example.com')
    ).rejects.toThrow('NEXT_PUBLIC_USERS_API_URL is not set');
    expect(mockUpdateCachedUserProfile).not.toHaveBeenCalled();
  });
});
