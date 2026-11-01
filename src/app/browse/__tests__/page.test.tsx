import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import BrowsePage from '../page';
import { FridgeList } from 'features/fridge-list';
import { useFridgeStore } from 'store/useFridgeStore';
import { useMapStore } from 'store/useMapStore';
import type { Fridge } from 'types/domain';

jest.mock('store/useFridgeStore');
jest.mock('hooks/useAnalytics', () => ({
  useAnalytics: () => ({ trackEvent: jest.fn() }),
}));
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: () => () => <div data-testid="map">Map</div>,
}));
jest.mock('features/fridge-list', () => ({
  ...jest.requireActual('features/fridge-list'),
  FridgeList: jest.fn(
    ({
      fridges,
      onFridgeSelect,
    }: {
      fridges: Fridge[];
      onFridgeSelect?: (id: string) => void;
    }) => (
      <div data-testid="main-list">
        {fridges.length > 0 && (
          <button onClick={() => onFridgeSelect?.(fridges[0].id)}>
            Select list fridge
          </button>
        )}
      </div>
    )
  ),
}));

const fridge: Fridge = {
  id: 'test-fridge',
  name: 'Test Fridge',
  verified: true,
  location: {
    street: '123 Test St',
    city: 'Brooklyn',
    state: 'NY',
    zip: '11201',
    geoLat: 40.7,
    geoLng: -74,
  },
  maintainer: {},
  report: null,
};
const fetchFridges = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  useMapStore.setState({ selectedFridgeId: null });
  jest.mocked(useFridgeStore).mockReturnValue({
    fridges: [fridge],
    status: 'success',
    error: null,
    fetchFridges,
  });
});

it('keeps the desktop main list mounted alongside the map', () => {
  render(<BrowsePage />);
  expect(screen.getByTestId('main-list')).toBeInTheDocument();
  expect(screen.getByTestId('map')).toBeInTheDocument();
  expect(fetchFridges).toHaveBeenCalled();
});

it('keeps the same main list mounted across view switches and selection', () => {
  render(<BrowsePage />);
  const preparedList = screen.getByTestId('main-list');

  fireEvent.click(screen.getByRole('button', { name: 'Show List' }));
  expect(screen.getByTestId('main-list')).toBe(preparedList);
  fireEvent.click(screen.getByRole('button', { name: 'Select list fridge' }));
  expect(useMapStore.getState().selectedFridgeId).toBe(fridge.id);
  expect(screen.getByTestId('main-list')).toBe(preparedList);

  fireEvent.click(screen.getByRole('button', { name: 'Show List' }));
  expect(screen.getByTestId('main-list')).toBe(preparedList);
  fireEvent.click(screen.getByRole('button', { name: 'Show Map' }));
  expect(screen.getByTestId('main-list')).toBe(preparedList);
});

it('passes search and filter changes through the list reset key', () => {
  render(<BrowsePage />);
  const initialKey = jest.mocked(FridgeList).mock.calls.at(-1)?.[0].resetKey;
  fireEvent.change(screen.getAllByRole('textbox')[1], {
    target: { value: 'Test' },
  });
  const searchKey = jest.mocked(FridgeList).mock.calls.at(-1)?.[0].resetKey;
  expect(searchKey).not.toBe(initialKey);

  fireEvent.click(screen.getAllByRole('button', { name: 'No Data Yet' })[0]);
  const filterKey = jest.mocked(FridgeList).mock.calls.at(-1)?.[0].resetKey;
  expect(filterKey).not.toBe(searchKey);
});

it('preserves error and retry behavior without mounting the main list', () => {
  jest.mocked(useFridgeStore).mockReturnValue({
    fridges: [],
    status: 'error',
    error: 'Unable to load test fridges',
    fetchFridges,
  });
  render(<BrowsePage />);
  expect(screen.getByText('Unable to load test fridges')).toBeInTheDocument();
  expect(screen.queryByTestId('main-list')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
  expect(fetchFridges).toHaveBeenCalledTimes(2);
});

it('does not mount the main list during loading or for an empty dataset', () => {
  jest.mocked(useFridgeStore).mockReturnValue({
    fridges: [],
    status: 'loading',
    error: null,
    fetchFridges,
  });
  const { rerender } = render(<BrowsePage />);
  expect(screen.queryByTestId('main-list')).not.toBeInTheDocument();
  jest.mocked(useFridgeStore).mockReturnValue({
    fridges: [],
    status: 'empty',
    error: null,
    fetchFridges,
  });
  rerender(<BrowsePage />);
  expect(screen.getByText('No items found.')).toBeInTheDocument();
  expect(screen.queryByTestId('main-list')).not.toBeInTheDocument();
});
