import React from 'react';
import { act, render } from '@testing-library/react';
import { MapContainer } from '../MapContainer';
import { useMapSync } from '../../hooks/useMapSync';
import { useMapStore } from 'store/useMapStore';
import { browseCities } from '../../config/browseCities';

const mockMap = {
  on: jest.fn(),
  off: jest.fn(),
  getCenter: jest.fn(() => ({ lat: 43, lng: -79 })),
  getZoom: jest.fn(() => 15),
};
const mockLocateUser = jest.fn();
const mockLeafletContainer = jest.fn(
  ({ children }: { children: React.ReactNode }) => <>{children}</>
);

jest.mock('react-leaflet', () => ({
  MapContainer: (props: { children: React.ReactNode }) =>
    mockLeafletContainer(props),
  TileLayer: () => null,
  useMap: () => mockMap,
}));
jest.mock('../../hooks/useMapSync', () => ({
  useMapSync: jest.fn(() => ({ locateUser: mockLocateUser })),
}));
jest.mock('../layers/MarkerLayer', () => ({ MarkerLayer: () => null }));
jest.mock('../LegendDrawer', () => ({ LegendDrawer: () => null }));

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  useMapStore.setState({ center: [51.5, -0.1], zoom: 16 });
});

afterEach(() => jest.useRealTimers());

it('starts at the city center with saved zoom and keeps location tracking', () => {
  render(<MapContainer fridges={[]} initialCenter={browseCities.buffalo} />);
  expect(mockLeafletContainer).toHaveBeenLastCalledWith(
    expect.objectContaining({ center: browseCities.buffalo, zoom: 16 })
  );
  expect(useMapSync).toHaveBeenLastCalledWith({
    fridges: [],
    autoRecenter: false,
  });
  expect(mockLocateUser).toHaveBeenCalledTimes(1);
});

it('retains the saved center and automatic recentering without a city override', () => {
  render(<MapContainer fridges={[]} />);
  expect(mockLeafletContainer).toHaveBeenLastCalledWith(
    expect.objectContaining({ center: [51.5, -0.1], zoom: 16 })
  );
  expect(useMapSync).toHaveBeenLastCalledWith({
    fridges: [],
    autoRecenter: true,
  });
});

it('persists user panning and zoom without restarting location tracking', () => {
  const { rerender } = render(
    <MapContainer fridges={[]} initialCenter={browseCities.buffalo} />
  );
  const handler = mockMap.on.mock.calls.find(
    ([event]) => event === 'moveend'
  )?.[1];
  act(() => {
    handler();
    jest.advanceTimersByTime(500);
  });
  rerender(<MapContainer fridges={[]} initialCenter={browseCities.buffalo} />);
  expect(useMapStore.getState()).toMatchObject({
    center: [43, -79],
    zoom: 15,
  });
  expect(JSON.parse(localStorage.getItem('ff-map-storage')!).state).toEqual({
    center: [43, -79],
    zoom: 15,
  });
  expect(mockLocateUser).toHaveBeenCalledTimes(1);
});
