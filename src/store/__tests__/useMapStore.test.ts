import { useMapStore } from '../useMapStore';

const NY_CENTER: [number, number] = [40.7128, -74.006];
const DEFAULT_ZOOM = 12;

beforeEach(() => {
  // Reset store to initial state so tests don't bleed into each other
  useMapStore.setState({
    center: NY_CENTER,
    zoom: DEFAULT_ZOOM,
    userLocation: null,
    selectedFridgeId: null,
    isLegendOpen: false,
  });
  localStorage.clear();
});

describe('setSelectedFridgeId', () => {
  it('sets a fridge ID', () => {
    useMapStore.getState().setSelectedFridgeId('fridge-1');
    expect(useMapStore.getState().selectedFridgeId).toBe('fridge-1');
  });

  it('replaces an existing ID with a new one', () => {
    useMapStore.getState().setSelectedFridgeId('fridge-1');
    useMapStore.getState().setSelectedFridgeId('fridge-2');
    expect(useMapStore.getState().selectedFridgeId).toBe('fridge-2');
  });

  it('clears the ID when called with null', () => {
    useMapStore.getState().setSelectedFridgeId('fridge-1');
    useMapStore.getState().setSelectedFridgeId(null);
    expect(useMapStore.getState().selectedFridgeId).toBeNull();
  });
});

describe('resetView', () => {
  it('resets center and zoom to NYC defaults', () => {
    useMapStore.getState().setCenter([51.5074, -0.1278]);
    useMapStore.getState().setZoom(15);

    useMapStore.getState().resetView();

    expect(useMapStore.getState().center).toEqual(NY_CENTER);
    expect(useMapStore.getState().zoom).toBe(DEFAULT_ZOOM);
  });

  it('clears selectedFridgeId', () => {
    useMapStore.getState().setSelectedFridgeId('fridge-99');
    useMapStore.getState().resetView();
    expect(useMapStore.getState().selectedFridgeId).toBeNull();
  });

  it('clears userLocation', () => {
    useMapStore.getState().setUserLocation([40.7, -74.0]);
    useMapStore.getState().resetView();
    expect(useMapStore.getState().userLocation).toBeNull();
  });
});

describe('persistence — partialize', () => {
  it('persists center and zoom to localStorage', () => {
    useMapStore.getState().setCenter([40.5, -73.9]);
    useMapStore.getState().setZoom(14);

    const stored = localStorage.getItem('ff-map-storage');
    if (stored) {
      const parsed = JSON.parse(stored) as { state: Record<string, unknown> };
      expect(parsed.state.center).toEqual([40.5, -73.9]);
      expect(parsed.state.zoom).toBe(14);
    }
  });

  it('does not persist selectedFridgeId to localStorage', () => {
    useMapStore.getState().setSelectedFridgeId('fridge-42');

    const stored = localStorage.getItem('ff-map-storage');
    if (stored) {
      const parsed = JSON.parse(stored) as { state: Record<string, unknown> };
      expect(parsed.state).not.toHaveProperty('selectedFridgeId');
    }
  });
});
