import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import BrowsePage from '../page';
import SharedBrowsePage from 'features/fridge-map/components/BrowsePage';
import { browseCities } from 'features/fridge-map/config/browseCities';
import { FridgeList } from 'features/fridge-list';
import { useFridgeStore } from 'store/useFridgeStore';
import { useMapStore } from 'store/useMapStore';
import type { Fridge } from 'types/domain';

const mockMap = { flyTo: jest.fn(), locate: jest.fn() };

jest.mock('store/useFridgeStore');
jest.mock('hooks/useAnalytics', () => ({
  useAnalytics: () => ({ trackEvent: jest.fn() }),
}));
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: () =>
    function MockMap({
      mapRef,
    }: {
      mapRef: React.RefObject<typeof mockMap | null>;
    }) {
      React.useEffect(() => {
        mapRef.current = mockMap;
      }, [mapRef]);
      return <div data-testid="map">Map</div>;
    },
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
  useMapStore.setState({
    center: [40.7128, -74.006],
    zoom: 12,
    selectedFridgeId: null,
    userLocation: null,
  });
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

it('resets the saved center, zoom and stale selection for a city without changing user location', () => {
  useMapStore.setState({
    center: [51.5, -0.1],
    zoom: 16,
    selectedFridgeId: fridge.id,
    userLocation: [40.7, -74],
  });
  const buffaloFridge: Fridge = {
    ...fridge,
    id: 'buffalo-fridge',
    location: {
      ...fridge.location,
      geoLat: browseCities.buffalo[0],
      geoLng: browseCities.buffalo[1],
    },
  };
  jest.mocked(useFridgeStore).mockReturnValue({
    fridges: [fridge, buffaloFridge],
    status: 'success',
    error: null,
    fetchFridges,
  });

  render(<SharedBrowsePage initialCenter={browseCities.buffalo} />);

  expect(useMapStore.getState()).toMatchObject({
    center: browseCities.buffalo,
    zoom: 12,
    selectedFridgeId: null,
    userLocation: [40.7, -74],
  });
  expect(jest.mocked(FridgeList).mock.calls.at(-1)?.[0].fridges[0].id).toBe(
    buffaloFridge.id
  );
});

it('applies the city center even while fridge data is loading', () => {
  jest.mocked(useFridgeStore).mockReturnValue({
    fridges: [],
    status: 'loading',
    error: null,
    fetchFridges,
  });
  render(<SharedBrowsePage initialCenter={browseCities.buffalo} />);
  expect(useMapStore.getState().center).toEqual(browseCities.buffalo);
  expect(screen.getByTestId('map')).toBeInTheDocument();
});

it('does not reset city panning, zoom or subsequent fridge selection on rerenders', () => {
  const { rerender } = render(
    <SharedBrowsePage initialCenter={browseCities.buffalo} />
  );
  act(() => {
    useMapStore.getState().setCenter([43, -79]);
    useMapStore.getState().setZoom(17);
    useMapStore.getState().setSelectedFridgeId(fridge.id);
  });
  rerender(<SharedBrowsePage initialCenter={[...browseCities.buffalo]} />);
  expect(useMapStore.getState().center).toEqual([43, -79]);
  expect(useMapStore.getState().zoom).toBe(17);
  expect(useMapStore.getState().selectedFridgeId).toBe(fridge.id);
});

it('resets zoom again when reloading a city view', () => {
  const { unmount } = render(
    <SharedBrowsePage initialCenter={browseCities.buffalo} />
  );
  act(() => useMapStore.getState().setZoom(18));
  unmount();
  render(<SharedBrowsePage initialCenter={browseCities.buffalo} />);
  expect(useMapStore.getState().zoom).toBe(12);
});

it('uses Detroit zoom 10 on entry and reload without overriding later zoom changes', () => {
  useMapStore.getState().setZoom(18);
  const { rerender, unmount } = render(
    <SharedBrowsePage initialCenter={browseCities.detroit} initialZoom={10} />
  );
  expect(useMapStore.getState().zoom).toBe(10);
  act(() => useMapStore.getState().setZoom(14));
  rerender(
    <SharedBrowsePage initialCenter={browseCities.detroit} initialZoom={10} />
  );
  expect(useMapStore.getState().zoom).toBe(14);
  unmount();
  render(
    <SharedBrowsePage initialCenter={browseCities.detroit} initialZoom={10} />
  );
  expect(useMapStore.getState().zoom).toBe(10);
});

it('applies a new initial center when navigating between city views', () => {
  const { rerender } = render(
    <SharedBrowsePage initialCenter={browseCities.buffalo} />
  );
  act(() => useMapStore.getState().setSelectedFridgeId(fridge.id));
  rerender(<SharedBrowsePage initialCenter={[41, -75]} />);
  expect(useMapStore.getState().center).toEqual([41, -75]);
  expect(useMapStore.getState().selectedFridgeId).toBeNull();
});

it('preserves the saved view and selection on plain browse', () => {
  useMapStore.setState({
    center: [43, -79],
    zoom: 16,
    selectedFridgeId: fridge.id,
  });
  render(<BrowsePage />);
  expect(useMapStore.getState()).toMatchObject({
    center: [43, -79],
    zoom: 16,
    selectedFridgeId: fridge.id,
  });
});

it('allows explicit recentering to a known user location on a city link', () => {
  useMapStore.getState().setUserLocation([40.7, -74]);
  render(<SharedBrowsePage initialCenter={browseCities.buffalo} />);
  fireEvent.click(screen.getByRole('button', { name: 'Find my location' }));
  expect(mockMap.flyTo).toHaveBeenCalledWith([40.7, -74], 15, {
    animate: true,
    duration: 1,
  });
});

it('allows explicit location requests to move the viewport on a city link', () => {
  render(<SharedBrowsePage initialCenter={browseCities.buffalo} />);
  fireEvent.click(screen.getByRole('button', { name: 'Find my location' }));
  expect(mockMap.locate).toHaveBeenCalledWith(
    expect.objectContaining({ watch: true, setView: true, maxZoom: 15 })
  );
});
