import { act, renderHook } from '@testing-library/react';
import L from 'leaflet';
import { useMapStore } from 'store/useMapStore';
import { useMapSync } from '../useMapSync';
import type { Fridge } from 'types/domain';

const mockMap = {
  on: jest.fn(),
  off: jest.fn(),
  stopLocate: jest.fn(),
  locate: jest.fn(),
  flyTo: jest.fn(),
  fitBounds: jest.fn(),
  setView: jest.fn(),
  getZoom: jest.fn(() => 12),
};
const mockMarker = {
  addTo: jest.fn().mockReturnThis(),
  setLatLng: jest.fn(),
  setIcon: jest.fn(),
  remove: jest.fn(),
};
const mockCircle = {
  addTo: jest.fn().mockReturnThis(),
  setLatLng: jest.fn(),
  setRadius: jest.fn(),
  remove: jest.fn(),
};

jest.mock('react-leaflet', () => ({
  useMap: () => mockMap,
}));
jest.mock('leaflet', () => ({
  __esModule: true,
  default: {
    marker: jest.fn(() => mockMarker),
    circle: jest.fn(() => mockCircle),
    divIcon: jest.fn(),
    latLngBounds: jest.fn(),
  },
}));

const fridge: Fridge = {
  id: 'nyc-fridge',
  name: 'NYC Fridge',
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

beforeEach(() => {
  jest.clearAllMocks();
  useMapStore.setState({
    userLocation: null,
    selectedFridgeId: null,
    center: [42.92771778130319, -78.85146118573536],
  });
});

function findLocation(lat: number, lng: number) {
  const handler = mockMap.on.mock.calls.find(
    ([event]) => event === 'locationfound'
  )?.[1];
  expect(handler).toBeDefined();
  act(() => handler({ latlng: { lat, lng }, accuracy: 100, heading: null }));
}

it.each([
  [40.7, -74],
  [42.92771778130319, -78.85146118573536],
])('tracks location without moving a city viewport (%s, %s)', (lat, lng) => {
  renderHook(() => useMapSync({ fridges: [fridge], autoRecenter: false }));
  findLocation(lat, lng);
  findLocation(lat + 0.001, lng);
  expect(useMapStore.getState().userLocation).toEqual([lat + 0.001, lng]);
  expect(mockMarker.addTo).toHaveBeenCalledWith(mockMap);
  expect(mockCircle.addTo).toHaveBeenCalledWith(mockMap);
  expect(mockMarker.setLatLng).toHaveBeenCalled();
  expect(mockMap.flyTo).not.toHaveBeenCalled();
  expect(mockMap.fitBounds).not.toHaveBeenCalled();
  expect(useMapStore.getState().center).toEqual([
    42.92771778130319, -78.85146118573536,
  ]);
});

it('keeps automatic recentering enabled by default for plain browse', () => {
  renderHook(() => useMapSync({ fridges: [] }));
  findLocation(40.7, -74);
  findLocation(40.71, -74);
  expect(mockMap.flyTo).toHaveBeenCalledTimes(1);
  expect(mockMap.flyTo).toHaveBeenCalledWith({ lat: 40.7, lng: -74 }, 14, {
    animate: false,
  });
});

it('preserves the existing distant-user bounds behavior for plain browse', () => {
  renderHook(() => useMapSync({ fridges: [fridge] }));
  findLocation(42.92771778130319, -78.85146118573536);
  expect(L.latLngBounds).toHaveBeenCalled();
  expect(mockMap.fitBounds).toHaveBeenCalledTimes(1);
});

it('still moves to a subsequently selected fridge on a city route', () => {
  renderHook(() => useMapSync({ fridges: [fridge], autoRecenter: false }));
  act(() => useMapStore.getState().setSelectedFridgeId(fridge.id));
  expect(mockMap.setView).toHaveBeenCalledWith([40.7, -74], 13);
});

it('keeps the city center when permission is denied and cleans up tracking', () => {
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const { unmount } = renderHook(() =>
    useMapSync({ fridges: [], autoRecenter: false })
  );
  const handler = mockMap.on.mock.calls.find(
    ([event]) => event === 'locationerror'
  )?.[1];
  act(() => handler({ code: 1, message: 'Permission denied' }));
  expect(warning).toHaveBeenCalled();
  expect(mockMap.stopLocate).toHaveBeenCalledTimes(1);
  expect(mockMap.flyTo).not.toHaveBeenCalled();
  expect(mockMap.fitBounds).not.toHaveBeenCalled();
  expect(useMapStore.getState().center).toEqual([
    42.92771778130319, -78.85146118573536,
  ]);
  unmount();
  expect(mockMap.off).toHaveBeenCalledWith(
    'locationfound',
    expect.any(Function)
  );
  expect(mockMap.stopLocate).toHaveBeenCalledTimes(2);
  warning.mockRestore();
});
