import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  formatActivityTimestamp,
  generateAnonymousMoniker,
  FridgeActivity,
} from '../FridgeActivity';
import { ReportContainer } from '../FridgeInformation';

const mockFetch = jest.fn();

beforeEach(() => {
  mockFetch.mockReset();
  global.fetch = mockFetch;
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

it('generates an adjective and Neighbor anonymous moniker', () => {
  const randomSpy = jest
    .spyOn(Math, 'random')
    .mockReturnValueOnce(0)
    .mockReturnValueOnce(0);

  expect(generateAnonymousMoniker()).toBe('DependableNeighbor');
  randomSpy.mockRestore();
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
  expect(firstAuthor).toMatch(/^[A-Z][a-z]+Neighbor$/);
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
