import type { UserCredential } from 'firebase/auth';

const NEW_USER_ONBOARDING_KEY = 'ff-new-user-onboarding';

// registerNewUser is loaded fresh per describe block via jest.isolateModules so
// we can control NEXT_PUBLIC_USERS_API_URL before the module-level const is captured.

const TEST_API_URL = 'http://test-users-api';

function makeCredential(
  overrides: {
    uid?: string;
    email?: string | null;
    phoneNumber?: string | null;
    isNewUser?: boolean;
  } = {}
): UserCredential {
  return {
    user: {
      uid: overrides.uid ?? 'uid-123',
      email:
        overrides.email !== undefined ? overrides.email : 'user@example.com',
      phoneNumber: overrides.phoneNumber ?? null,
      getIdToken: jest.fn().mockResolvedValue('id-token-abc'),
    },
    _tokenResponse:
      overrides.isNewUser === undefined
        ? undefined
        : { isNewUser: overrides.isNewUser },
  } as unknown as UserCredential;
}

describe('registerNewUser (URL set)', () => {
  let registerNewUser: (cred: UserCredential) => Promise<void>;
  let getAdditionalUserInfoMock: jest.Mock;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_USERS_API_URL = TEST_API_URL;
    getAdditionalUserInfoMock = jest.fn().mockReturnValue(null);
    jest.doMock('firebase/auth', () => ({
      getAdditionalUserInfo: getAdditionalUserInfoMock,
    }));
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      ({ registerNewUser } = require('../registerNewUser'));
    });
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, status: 200, statusText: 'OK' });
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
    jest.unmock('firebase/auth');
    window.localStorage.clear();
  });

  it('sets onboarding key to pending when Firebase marks user as new', async () => {
    getAdditionalUserInfoMock.mockReturnValue({ isNewUser: true });

    await registerNewUser(makeCredential({ isNewUser: true }));

    expect(window.localStorage.getItem(NEW_USER_ONBOARDING_KEY)).toBe(
      'pending'
    );
  });

  it('does not set onboarding key when Firebase marks user as existing', async () => {
    getAdditionalUserInfoMock.mockReturnValue({ isNewUser: false });

    await registerNewUser(makeCredential({ isNewUser: false }));

    expect(window.localStorage.getItem(NEW_USER_ONBOARDING_KEY)).toBeNull();
  });

  it('POSTs to /v1/users with userId and email', async () => {
    const credential = makeCredential({ uid: 'uid-1', email: 'a@b.com' });
    await registerNewUser(credential);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_API_URL}/v1/users`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ userId: 'uid-1', email: 'a@b.com' }),
      })
    );
  });

  it('POSTs to /v1/users with userId and phone', async () => {
    const credential = makeCredential({
      uid: 'uid-2',
      email: null,
      phoneNumber: '+15551234567',
    });
    await registerNewUser(credential);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_API_URL}/v1/users`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ userId: 'uid-2', phoneNumber: '+15551234567' }),
      })
    );
  });

  it('sets the Authorization header with the Bearer token', async () => {
    const credential = makeCredential({});
    await registerNewUser(credential);

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer id-token-abc',
        }),
      })
    );
  });

  it('does not log an error on a 409 (user already registered)', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 409, statusText: 'Conflict' });
    await registerNewUser(makeCredential({}));

    expect(console.error).not.toHaveBeenCalled();
  });

  it('logs an error on an unexpected non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });
    await registerNewUser(makeCredential({}));

    expect(console.error).toHaveBeenCalledWith(
      '[registerNewUser] API error 500: Internal Server Error'
    );
  });

  it('logs a network error when fetch throws', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network failure'));
    await registerNewUser(makeCredential({}));

    expect(console.error).toHaveBeenCalledWith(
      '[registerNewUser] Network error:',
      expect.any(Error)
    );
  });
});

describe('registerNewUser (URL not set)', () => {
  let registerNewUser: (cred: UserCredential) => Promise<void>;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_USERS_API_URL;
    jest.doMock('firebase/auth', () => ({
      getAdditionalUserInfo: jest.fn().mockReturnValue(null),
    }));
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      ({ registerNewUser } = require('../registerNewUser'));
    });
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_USERS_API_URL = TEST_API_URL;
    jest.restoreAllMocks();
    jest.resetModules();
    jest.unmock('firebase/auth');
  });

  it('does not call fetch and logs an error', async () => {
    await registerNewUser(makeCredential({}));

    expect(fetch).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      '[registerNewUser] Network error:',
      expect.objectContaining({
        message: 'NEXT_PUBLIC_USERS_API_URL is not set',
      })
    );
  });
});
