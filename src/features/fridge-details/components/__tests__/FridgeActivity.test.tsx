import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { formatActivityTimestamp, FridgeActivity } from '../FridgeActivity';
import { ReportContainer } from '../FridgeInformation';

const mockFetch = jest.fn();
const mockAddDoc = jest.fn();
const mockCollection = jest.fn();

jest.mock('firebase/firestore', () => ({
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  collection: (...args: unknown[]) => mockCollection(...args),
  serverTimestamp: () => 'server-timestamp',
}));

jest.mock('config/firebase', () => ({
  getFirebaseFirestore: () => 'firestore',
}));

beforeEach(() => {
  mockFetch.mockReset();
  mockAddDoc.mockReset();
  mockCollection.mockReset().mockReturnValue('flagged-reports-collection');
  global.fetch = mockFetch;
});

function renderFlaggableReport() {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      reports: [
        {
          fridgeId: 'greenpointfridge',
          timestamp: '2026-10-13T11:00:00Z',
          condition: 'good',
          foodPercentage: 1,
          epochTimestamp: '1791889200',
          photoUrl: 'https://example.com/greenpoint.jpg',
          notes: 'Needs restocking.',
        },
      ],
      nextToken: null,
    }),
  });
  render(
    <FridgeActivity
      fridgeId="greenpointfridge"
      fridgeName="Greenpoint Fridge"
    />
  );
}

it.each(['harmful', 'inaccurate'])(
  'submits a %s flag for a report without requiring sign-in',
  async (reason) => {
    const label = reason === 'harmful' ? 'Harmful' : 'Inaccurate';
    mockAddDoc.mockResolvedValueOnce({ id: 'flag-1' });
    renderFlaggableReport();
    fireEvent.click(await screen.findByRole('button', { name: 'Report' }));
    expect(screen.getAllByRole('menuitem')).toHaveLength(2);
    fireEvent.click(screen.getByRole('menuitem', { name: label }));

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Report submitted. Thank you for letting us know.'
    );
    expect(mockCollection).toHaveBeenCalledWith(
      'firestore',
      'FlaggedFridgeReports'
    );
    expect(mockAddDoc).toHaveBeenCalledTimes(1);
    expect(mockAddDoc).toHaveBeenCalledWith('flagged-reports-collection', {
      fridgeId: 'greenpointfridge',
      reportTimestamp: '2026-10-13T11:00:00Z',
      reason,
      status: 'none',
      report: {
        fridgeId: 'greenpointfridge',
        timestamp: '2026-10-13T11:00:00Z',
        condition: 'good',
        foodPercentage: 1,
        epochTimestamp: '1791889200',
        photoUrl: 'https://example.com/greenpoint.jpg',
        notes: 'Needs restocking.',
      },
      createdAt: 'server-timestamp',
    });
    expect(
      screen.getByRole('button', { name: 'Report' }).hasAttribute('disabled')
    ).toBe(false);
    expect(screen.queryByRole('menu')).toBeNull();
  }
);

it('omits absent or non-string optional fields from the report snapshot', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      reports: [
        {
          fridgeId: 'greenpointfridge',
          timestamp: '2026-10-13T11:00:00Z',
          condition: 'good',
          foodPercentage: 1,
          epochTimestamp: 1791889200,
          photoUrl: null,
          notes: null,
        },
      ],
      nextToken: null,
    }),
  });
  mockAddDoc.mockResolvedValueOnce({ id: 'flag-no-optional-fields' });

  render(
    <FridgeActivity
      fridgeId="greenpointfridge"
      fridgeName="Greenpoint Fridge"
    />
  );
  fireEvent.click(await screen.findByRole('button', { name: 'Report' }));
  fireEvent.click(screen.getByRole('menuitem', { name: 'Harmful' }));
  await screen.findByRole('alert');

  expect(mockAddDoc).toHaveBeenCalledWith('flagged-reports-collection', {
    fridgeId: 'greenpointfridge',
    reportTimestamp: '2026-10-13T11:00:00Z',
    reason: 'harmful',
    status: 'none',
    report: {
      fridgeId: 'greenpointfridge',
      timestamp: '2026-10-13T11:00:00Z',
      condition: 'good',
      foodPercentage: 1,
    },
    createdAt: 'server-timestamp',
  });
});

it('disables flagging while the submission is pending', async () => {
  let resolveSubmission: (() => void) | undefined;
  mockAddDoc.mockReturnValueOnce(
    new Promise<void>((resolve) => {
      resolveSubmission = resolve;
    })
  );
  renderFlaggableReport();
  fireEvent.click(await screen.findByRole('button', { name: 'Report' }));
  fireEvent.click(screen.getByRole('menuitem', { name: 'Harmful' }));
  expect(
    screen
      .getByRole('button', { name: 'Reporting...' })
      .hasAttribute('disabled')
  ).toBe(true);
  expect(screen.queryByRole('status')).toBeNull();
  resolveSubmission?.();
  expect(
    (await screen.findByRole('button', { name: 'Report' })).hasAttribute(
      'disabled'
    )
  ).toBe(false);
});

it('allows reporting again after a successful report', async () => {
  mockAddDoc.mockResolvedValue({ id: 'repeat-flag' });
  renderFlaggableReport();
  fireEvent.click(await screen.findByRole('button', { name: 'Report' }));
  fireEvent.click(screen.getByRole('menuitem', { name: 'Inaccurate' }));
  await screen.findByRole('alert');

  fireEvent.click(screen.getByRole('button', { name: 'Report' }));
  expect(screen.getAllByRole('menuitem')).toHaveLength(2);
  fireEvent.click(screen.getByRole('menuitem', { name: 'Harmful' }));

  await waitFor(() => expect(mockAddDoc).toHaveBeenCalledTimes(2));
});

it('shows feedback in a bottom snackbar and preserves the report button after dismissal', async () => {
  mockAddDoc.mockResolvedValueOnce({ id: 'flag-toast' });
  renderFlaggableReport();
  fireEvent.click(await screen.findByRole('button', { name: 'Report' }));
  fireEvent.click(screen.getByRole('menuitem', { name: 'Harmful' }));
  const message = await screen.findByRole('alert');
  const snackbar = message.closest('.MuiSnackbar-root');
  if (!snackbar) throw new Error('Expected feedback inside a snackbar');
  expect(snackbar?.className).toContain('MuiSnackbar-anchorOriginBottomCenter');
  expect(getComputedStyle(snackbar).position).toBe('fixed');
  fireEvent.keyDown(message, { key: 'Escape' });
  await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  expect(
    screen.getByRole('button', { name: 'Report' }).hasAttribute('disabled')
  ).toBe(false);
});

it('shows a failed flag submission and allows retrying', async () => {
  const error = new Error('Permission denied');
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    mockAddDoc
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce({ id: 'flag-2' });
    renderFlaggableReport();
    fireEvent.click(await screen.findByRole('button', { name: 'Report' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Inaccurate' }));
    expect((await screen.findByRole('alert')).textContent).toContain(
      'Unable to submit your report. Please try again.'
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      'Unable to flag fridge report:',
      error
    );
    fireEvent.click(screen.getByRole('button', { name: 'Report' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Harmful' }));
    expect(
      await screen.findByText(
        'Report submitted. Thank you for letting us know.'
      )
    ).toBeTruthy();
    expect(
      screen.queryByText('Unable to submit your report. Please try again.')
    ).toBeNull();
    expect(mockAddDoc).toHaveBeenCalledTimes(2);
  } finally {
    consoleSpy.mockRestore();
  }
});

it('dismisses the flag menu without submitting', async () => {
  renderFlaggableReport();
  fireEvent.click(await screen.findByRole('button', { name: 'Report' }));
  fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
  await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
  expect(mockAddDoc).not.toHaveBeenCalled();
});

describe('formatActivityTimestamp', () => {
  const now = new Date('2026-10-13T12:00:00Z').getTime();

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(now);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    ['2026-10-13T11:59:55Z', '5 seconds ago'],
    ['2026-10-13T11:50:00Z', '10 minutes ago'],
    ['2026-10-13T09:00:00Z', '3 hours ago'],
    ['2026-10-10T12:00:00Z', '3 days ago'],
    ['2026-09-29T12:00:00Z', '2 weeks ago'],
    ['2026-09-15T12:00:00Z', '4 weeks ago'],
  ])('formats %s as %s', (timestamp, expected) => {
    expect(formatActivityTimestamp(timestamp)).toBe(expected);
  });

  it('uses the existing date and time format for timestamps older than four weeks', () => {
    const timestamp = '2026-09-14T11:59:59Z';
    const date = new Date(timestamp);
    const expected = date.toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    expect(formatActivityTimestamp(timestamp)).toBe(expected);
  });
});

it('loads report history pages using the returned continuation cursor', async () => {
  mockFetch
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        reports: [
          {
            fridgeId: 'greenpointfridge',
            timestamp: '2026-08-08T01:07:09Z',
            condition: 'good',
            foodPercentage: 1,
            notes: 'Fresh produce is available.',
            photoUrl:
              'https://community-fridge-map-images-dev.s3.amazonaws.com/report.webp',
          },
        ],
        nextToken: 'cursor + one',
      }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        reports: [
          {
            fridgeId: 'greenpointfridge',
            timestamp: '2026-06-16T22:23:52Z',
            condition: 'dirty',
            foodPercentage: 2,
          },
        ],
        nextToken: null,
      }),
    });

  render(
    <FridgeActivity
      fridgeId="greenpointfridge"
      fridgeName="Greenpoint Fridge"
    />
  );

  expect(await screen.findByText('Fresh produce is available.')).toBeTruthy();
  const reportImage = screen.getByRole('img', {
    name: 'Photo of the fridge status update',
  });
  expect(decodeURIComponent(reportImage.getAttribute('src') ?? '')).toContain(
    'https://community-fridge-map-images-dev.s3.amazonaws.com/report.webp'
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Expand fridge status photo' })
  );
  expect(
    screen.getByRole('dialog', { name: 'Fridge status photo viewer' })
  ).toBeTruthy();
  const zoomSurface = screen.getByRole('button', { name: 'Zoom in on photo' });
  Object.defineProperty(zoomSurface, 'getBoundingClientRect', {
    value: () => ({
      left: 100,
      top: 50,
      width: 400,
      height: 200,
      right: 500,
      bottom: 250,
      x: 100,
      y: 50,
      toJSON: () => ({}),
    }),
  });
  fireEvent.click(zoomSurface, { clientX: 300, clientY: 100 });
  expect(
    screen
      .getByRole('img', { name: 'Expanded photo of the fridge status update' })
      .getAttribute('style')
  ).toContain('scale(2)');
  expect(
    screen.getByRole('img', {
      name: 'Expanded photo of the fridge status update',
    }).style.transformOrigin
  ).toBe('50% 25%');
  fireEvent.click(screen.getByRole('button', { name: 'Zoom out on photo' }));
  expect(
    screen
      .getByRole('img', { name: 'Expanded photo of the fridge status update' })
      .getAttribute('style')
  ).toContain('scale(1)');
  fireEvent.click(screen.getByRole('button', { name: 'Close image viewer' }));
  await waitFor(() => {
    expect(
      screen.queryByRole('dialog', { name: 'Fridge status photo viewer' })
    ).toBeNull();
  });
  const firstAuthor = screen
    .getByRole('article')
    .querySelector('p')?.textContent;
  expect(firstAuthor).toBe('Anonymous');
  const anonymousIcon = screen.getByTestId('AccountCircleIcon');
  expect(anonymousIcon).toBeTruthy();
  const anonymousAvatar = anonymousIcon.parentElement;
  expect(anonymousAvatar).not.toBeNull();
  if (anonymousAvatar) {
    const avatarStyle = getComputedStyle(anonymousAvatar);
    expect(avatarStyle.color).toBe('rgb(216, 216, 216)');
    expect(avatarStyle.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(avatarStyle.borderColor).toBe('rgb(230, 231, 235)');
    expect(avatarStyle.borderWidth).toBe('1px');
  }
  expect(
    screen.getByRole('article').querySelector('[aria-hidden="true"]')
      ?.textContent
  ).toBe('');
  expect(
    screen.queryByText('No more past activity. Add a new update!')
  ).toBeNull();

  fireEvent.click(await screen.findByRole('button', { name: 'Load more' }));

  await waitFor(() => {
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
  expect(mockFetch).toHaveBeenLastCalledWith(
    '/v1/fridges/greenpointfridge/reports/history?nextToken=cursor%20%2B%20one',
    expect.objectContaining({ cache: 'no-store' })
  );
  expect(await screen.findByText('needs cleaning')).toBeTruthy();
  const authors = screen
    .getAllByRole('article')
    .map((article) => article.querySelector('p')?.textContent);
  expect(authors).toHaveLength(2);
  expect(authors.every((author) => author && author !== 'neighbor')).toBe(true);
  expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull();
  expect(
    screen.getByText('No more past activity. Add a new update!')
  ).toBeTruthy();
  const updateStatusLink = screen.getByRole('link', {
    name: 'Click to report the status of the fridge',
  });
  expect(updateStatusLink.getAttribute('href')).toBe(
    '/fridge/greenpointfridge/report?from=%2Ffridge%2Fgreenpointfridge&name=Greenpoint%20Fridge'
  );
});

it('displays the username returned by the users API for a report userId', async () => {
  const previousUsersApiUrl = process.env.NEXT_PUBLIC_USERS_API_URL;
  process.env.NEXT_PUBLIC_USERS_API_URL = 'https://users.example.com';
  mockFetch
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        reports: [
          {
            fridgeId: 'greenpointfridge',
            timestamp: '2026-10-13T11:00:00Z',
            condition: 'good',
            foodPercentage: 1,
            userId: 'user-abc',
          },
        ],
        nextToken: null,
      }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ username: 'blueberry_lover' }),
    });

  render(
    <FridgeActivity
      fridgeId="greenpointfridge"
      fridgeName="Greenpoint Fridge"
    />
  );

  expect(await screen.findByText('blueberry_lover')).toBeTruthy();
  expect(screen.queryByTestId('AccountCircleIcon')).toBeNull();
  expect(
    screen.getByRole('article').querySelector('[aria-hidden="true"]')
      ?.textContent
  ).toBe('B');
  expect(mockFetch).toHaveBeenLastCalledWith(
    'https://users.example.com/v1/users/user-abc/username',
    { headers: { Accept: 'application/json' } }
  );

  if (previousUsersApiUrl === undefined) {
    delete process.env.NEXT_PUBLIC_USERS_API_URL;
  } else {
    process.env.NEXT_PUBLIC_USERS_API_URL = previousUsersApiUrl;
  }
});

it('makes the Info tab latest report photo expandable', () => {
  render(
    <ReportContainer
      report={{
        fridgeId: 'greenpointfridge',
        timestamp: '2026-10-13T11:00:00Z',
        condition: 'good',
        foodPercentage: 2,
        photoUrl:
          'https://community-fridge-map-images-dev.s3.amazonaws.com/info-report.webp',
      }}
    />
  );

  expect(
    screen.getByRole('button', { name: 'Expand fridge status photo' })
  ).toBeTruthy();
});

it('prefetches in the background without showing a loading indicator while inactive', async () => {
  let resolveFetch:
    | ((response: { ok: boolean; json: () => Promise<unknown> }) => void)
    | undefined;
  mockFetch.mockReturnValueOnce(
    new Promise((resolve) => {
      resolveFetch = resolve;
    })
  );

  const { rerender } = render(
    <FridgeActivity
      fridgeId="greenpointfridge"
      fridgeName="Greenpoint Fridge"
      isActive={false}
    />
  );

  expect(mockFetch).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('status', { name: 'Loading activity' })).toBeNull();

  rerender(
    <FridgeActivity
      fridgeId="greenpointfridge"
      fridgeName="Greenpoint Fridge"
      isActive
    />
  );
  expect(screen.getByRole('status', { name: 'Loading activity' })).toBeTruthy();

  resolveFetch?.({
    ok: true,
    json: async () => ({ reports: [], nextToken: null }),
  });
  expect(
    await screen.findByText('No more past activity. Add a new update!')
  ).toBeTruthy();
});
