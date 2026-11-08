import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { FridgeInformation, openGoogleMapsIOS } from '../FridgeInformation';
import { Fridge } from 'types/domain';

jest.mock('../FollowButton', () => ({
  FollowButton: () => <a href="/alerts">Follow</a>,
}));
jest.mock('../ShareButton', () => ({
  ShareButton: () => <button>Share</button>,
}));
jest.mock('../FridgeBackButton', () => ({
  FridgeBackButton: () => <a href="/browse">Go to Map</a>,
}));
jest.mock('../FridgeActivity', () => ({
  FridgeActivity: ({
    canUpdate,
    isGhost,
  }: {
    canUpdate: boolean;
    isGhost: boolean;
  }) => (
    <div
      data-testid="activity"
      data-can-update={canUpdate}
      data-is-ghost={isGhost}
    />
  ),
}));

const mockFetch = jest.fn();
const fridge: Fridge = {
  id: 'fridge-1',
  name: 'Test Fridge',
  verified: true,
  maintainer: {},
  report: null,
  location: {
    street: '123 Main St',
    city: 'Brooklyn',
    state: 'NY',
    zip: '11201',
    geoLat: 40.7,
    geoLng: -74,
  },
};
beforeEach(() => {
  mockFetch.mockReset();
  global.fetch = mockFetch;
  jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

it('opens Google Maps on iOS and falls back to its HTTPS directions URL', () => {
  jest.useFakeTimers();
  const navigateTo = jest.fn();

  openGoogleMapsIOS('123 Main St, Brooklyn, NY 11201', navigateTo);

  expect(navigateTo).toHaveBeenCalledWith(
    `comgooglemaps://?${new URLSearchParams({
      daddr: '123 Main St, Brooklyn, NY 11201',
      directionsmode: 'driving',
    })}`
  );
  act(() => jest.advanceTimersByTime(1500));
  expect(navigateTo).toHaveBeenLastCalledWith(
    `https://www.google.com/maps/dir/?${new URLSearchParams({
      api: '1',
      destination: '123 Main St, Brooklyn, NY 11201',
    })}`
  );
});

it('cancels the Google Maps web fallback after the page is hidden', () => {
  jest.useFakeTimers();
  jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
  const navigateTo = jest.fn();

  openGoogleMapsIOS('123 Main St, Brooklyn, NY 11201', navigateTo);
  fireEvent(document, new Event('visibilitychange'));
  act(() => jest.advanceTimersByTime(1500));

  expect(navigateTo).toHaveBeenCalledTimes(1);
});

it.each([
  [
    'iPhone',
    `https://maps.apple.com/?${new URLSearchParams({
      daddr: '123 Main St, Brooklyn, NY 11201',
    })}`,
    undefined,
  ],
  [
    'Android',
    `https://www.google.com/maps/dir/?${new URLSearchParams({
      api: '1',
      destination: '123 Main St, Brooklyn, NY 11201',
    })}`,
    undefined,
  ],
  [
    'desktop',
    'https://www.google.com/maps/place/123%20Main%20St,%20Brooklyn,%20NY%2011201',
    '_blank',
  ],
])(
  'uses the preferred directions link for %s',
  async (userAgent, expectedHref, expectedTarget) => {
    jest.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(userAgent);
    mockFetch.mockResolvedValue({ ok: true, json: async () => [] });

    render(<FridgeInformation fridge={fridge} />);

    const directionsLink = await screen.findByRole('link', {
      name: 'Click to get directions to the fridge',
    });
    await waitFor(() =>
      expect(directionsLink).toHaveAttribute('href', expectedHref)
    );
    if (expectedTarget) {
      expect(directionsLink).toHaveAttribute('target', expectedTarget);
    } else {
      expect(directionsLink).not.toHaveAttribute('target', '_blank');
    }
  }
);

it('offers alternate map apps on mobile', async () => {
  jest.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue('iPhone');
  mockFetch.mockResolvedValue({ ok: true, json: async () => [] });

  render(<FridgeInformation fridge={fridge} />);

  fireEvent.click(
    await screen.findByRole('button', { name: 'Choose another maps app' })
  );

  expect(
    await screen.findByRole('menuitem', { name: 'Apple Maps' })
  ).toHaveAttribute(
    'href',
    `https://maps.apple.com/?${new URLSearchParams({
      daddr: '123 Main St, Brooklyn, NY 11201',
    })}`
  );
  expect(screen.getByRole('menuitem', { name: 'Google Maps' })).toHaveAttribute(
    'href',
    `https://www.google.com/maps/dir/?${new URLSearchParams({
      api: '1',
      destination: '123 Main St, Brooklyn, NY 11201',
    })}`
  );
  expect(screen.getByRole('menuitem', { name: 'Waze' })).toHaveAttribute(
    'href',
    `https://waze.com/ul?${new URLSearchParams({
      q: '123 Main St, Brooklyn, NY 11201',
      navigate: 'yes',
    })}`
  );
});

it('replaces both responsive ghost buttons with non-interactive notices from the live report', async () => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => [
      {
        fridgeId: fridge.id,
        timestamp: '2026-10-30T12:00:00Z',
        condition: 'ghost',
        foodPercentage: 0,
      },
    ],
  });
  const { container } = render(<FridgeInformation fridge={fridge} />);
  const notices = await screen.findAllByText(
    'Updates are disabled for Ghost fridges'
  );
  expect(notices).toHaveLength(2);
  for (const notice of notices) {
    expect(notice.closest('a,button,input,textarea')).toBeNull();
    expect(notice).toHaveStyle({
      textAlign: 'center',
      backgroundColor: '#F6F6F6',
      border: '1px solid #D8D8D8',
    });
  }
  expect(container.querySelectorAll('a[href*="/report"]')).toHaveLength(0);
  expect(screen.getByRole('link', { name: 'Follow' })).toBeInTheDocument();
  expect(screen.getByTestId('activity')).toHaveAttribute(
    'data-is-ghost',
    'true'
  );
  expect(screen.getByTestId('activity')).toHaveAttribute(
    'data-can-update',
    'false'
  );
  expect(mockFetch).toHaveBeenCalledTimes(1);
});

it.each(['good', 'dirty', 'out of order', 'not at location', null])(
  'keeps updates enabled for %s',
  async (condition) => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () =>
        condition === null
          ? []
          : [
              {
                fridgeId: fridge.id,
                timestamp: '2026-10-30T12:00:00Z',
                condition,
                foodPercentage: 0,
              },
            ],
    });
    render(<FridgeInformation fridge={fridge} />);
    await waitFor(() =>
      expect(
        screen.getAllByRole('link', { name: /report the status/i })
      ).toHaveLength(2)
    );
    expect(
      screen.queryByText('Updates are disabled for Ghost fridges')
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('activity')).toHaveAttribute(
      'data-can-update',
      'true'
    );
  }
);

it('keeps update links available while loading, on errors, and during retry', async () => {
  let resolve!: (response: unknown) => void;
  mockFetch.mockReturnValueOnce(
    new Promise((done) => {
      resolve = done;
    })
  );
  const { container } = render(<FridgeInformation fridge={fridge} />);
  expect(container.querySelectorAll('a[href*="/report"]')).toHaveLength(2);
  expect(screen.getByTestId('activity')).toHaveAttribute(
    'data-can-update',
    'true'
  );
  await act(async () => resolve({ ok: false, status: 503 }));
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Could not load the latest fridge report'
  );
  expect(container.querySelectorAll('a[href*="/report"]')).toHaveLength(2);
  fireEvent.click(screen.getByRole('tab', { name: 'Activity' }));
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Could not load the latest fridge report'
  );
  expect(screen.getByTestId('activity')).toHaveAttribute(
    'data-can-update',
    'true'
  );
  mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(screen.getByTestId('activity')).toHaveAttribute(
    'data-can-update',
    'true'
  );
  await waitFor(() =>
    expect(screen.getByTestId('activity')).toHaveAttribute(
      'data-can-update',
      'true'
    )
  );
});

it('shows the button immediately and replaces it only after Ghost is confirmed', async () => {
  let resolve!: (response: unknown) => void;
  mockFetch.mockReturnValueOnce(
    new Promise((done) => {
      resolve = done;
    })
  );
  const { container } = render(<FridgeInformation fridge={fridge} />);
  expect(container.querySelectorAll('a[href*="/report"]')).toHaveLength(2);
  expect(
    screen.queryByText('Updates are disabled for Ghost fridges')
  ).not.toBeInTheDocument();
  await act(async () =>
    resolve({
      ok: true,
      json: async () => [
        {
          fridgeId: fridge.id,
          timestamp: '2026-10-30T12:00:00Z',
          condition: 'ghost',
          foodPercentage: 0,
        },
      ],
    })
  );
  expect(container.querySelectorAll('a[href*="/report"]')).toHaveLength(0);
  expect(
    screen.getAllByText('Updates are disabled for Ghost fridges')
  ).toHaveLength(2);
  expect(screen.getByTestId('activity')).toHaveAttribute(
    'data-can-update',
    'false'
  );
});
