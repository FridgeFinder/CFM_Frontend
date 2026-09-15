import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MapState {
  center: [number, number];
  zoom: number;
  userLocation: [number, number] | null;
  selectedFridgeId: string | null;
  isLegendOpen: boolean;

  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  setUserLocation: (location: [number, number] | null) => void;
  setSelectedFridgeId: (id: string | null) => void;
  setLegendOpen: (isOpen: boolean) => void;
  resetView: () => void;
}

const NY_CENTER: [number, number] = [40.7128, -74.006];
const DEFAULT_ZOOM = 12;

export const useMapStore = create<MapState>()(
  persist(
    (set) => ({
      center: NY_CENTER,
      zoom: DEFAULT_ZOOM,
      userLocation: null,
      selectedFridgeId: null,
      isLegendOpen: false,

      setCenter: (center) => set({ center }),
      setZoom: (zoom) => set({ zoom }),
      setUserLocation: (userLocation) => set({ userLocation }),
      setSelectedFridgeId: (selectedFridgeId) => set({ selectedFridgeId }),
      setLegendOpen: (isLegendOpen) => set({ isLegendOpen }),
      resetView: () =>
        set({
          center: NY_CENTER,
          zoom: DEFAULT_ZOOM,
          selectedFridgeId: null,
          userLocation: null,
        }),
    }),
    {
      name: 'ff-map-storage',
      partialize: (state) => ({
        center: state.center,
        zoom: state.zoom,
        // userLocation: state.userLocation,//NOTE: intentionally not persisted
      }),
    }
  )
);
