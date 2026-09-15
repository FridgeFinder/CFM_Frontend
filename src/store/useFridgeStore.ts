import { create } from 'zustand';
import { Fridge, ApiFridge, AppStatus, FridgeReport } from 'types/domain';
import { apiClient } from 'utils/api-client';

interface FridgeState {
  fridges: Fridge[];
  status: AppStatus;
  error: string | null;
  lastUpdated: number | null;

  fetchFridges: () => Promise<void>;
  getFridgeById: (id: string) => Fridge | undefined;
  updateFridgeReport: (id: string, report: FridgeReport) => void;
  // Call after a successful report submission so the next fetchFridges
  // bypasses the TTL and returns fresh data.
  invalidate: () => void;
}

const transformFridge = (apiFridge: ApiFridge): Fridge => {
  const { latestFridgeReport, ...rest } = apiFridge;
  return {
    ...rest,
    report: latestFridgeReport || null,
  };
};

// Cached data is considered fresh for this long. Within the window:
//  - N+1 visits skip the network request entirely (both dev and prod)
//  - React StrictMode's second effect invocation deduplicates against the first
const FRIDGE_CACHE_TTL_MS = 1 * 60 * 1000; // 1 minute

// Module-level flag prevents concurrent duplicate fetches (e.g. StrictMode
// double-mount fires two calls before either resolves).
let isFetching = false;

export const useFridgeStore = create<FridgeState>((set, get) => ({
  fridges: [],
  status: 'idle',
  error: null,
  lastUpdated: null,

  fetchFridges: async () => {
    const { fridges, lastUpdated } = get();

    // 1. TTL guard: skip if we have fresh data
    if (
      fridges.length > 0 &&
      lastUpdated !== null &&
      Date.now() - lastUpdated < FRIDGE_CACHE_TTL_MS
    ) {
      return;
    }

    // 2. In-flight guard: deduplicate concurrent calls (React StrictMode
    //    fires the effect twice before the first fetch resolves)
    if (isFetching) return;
    isFetching = true;

    // Only show the loading skeleton when there is nothing to display yet.
    // On background re-fetches the existing list stays visible.
    if (fridges.length === 0) {
      set({ status: 'loading', error: null });
    }

    try {
      const apiFridges = await apiClient.getFridges();
      const fridges = apiFridges.map(transformFridge);

      set({
        fridges,
        status: fridges.length > 0 ? 'success' : 'empty',
        lastUpdated: Date.now(),
      });
    } catch (error) {
      // Only surface the error when there is nothing cached to show.
      if (get().fridges.length === 0) {
        set({
          status: 'error',
          error:
            error instanceof Error ? error.message : 'Failed to fetch fridges',
        });
      }
    } finally {
      isFetching = false;
    }
  },

  getFridgeById: (id: string) => {
    return get().fridges.find((f) => f.id === id);
  },

  updateFridgeReport: (id: string, report: FridgeReport) =>
    set((state) => ({
      fridges: state.fridges.map((fridge) =>
        fridge.id === id ? { ...fridge, report } : fridge
      ),
    })),

  invalidate: () => set({ lastUpdated: null }),
}));
