import {
  useState,
  useMemo,
  useDeferredValue,
  useRef,
  useEffect,
  useCallback,
  startTransition,
} from 'react';
import Fuse from 'fuse.js';
import { Fridge } from 'types/domain';
import { useMapStore } from 'store/useMapStore';
import { deltaInMeters } from 'utils/geo';

export type FoodLevelFilter = 'full' | 'many' | 'few' | 'empty';
export type ConditionFilter =
  | 'no-data'
  | 'not-at-location'
  | 'dirty'
  | 'out-of-order'
  | 'ghost';
export type FilterKey = FoodLevelFilter | ConditionFilter;

function fridgeMatchesFilter(fridge: Fridge, filter: FilterKey): boolean {
  const r = fridge.report;
  switch (filter) {
    case 'no-data':
      return r === null;
    case 'not-at-location':
      return r?.condition === 'not at location';
    case 'dirty':
      return r?.condition === 'dirty';
    case 'out-of-order':
      return r?.condition === 'out of order';
    case 'ghost':
      return r?.condition === 'ghost';
    case 'full':
      return r !== null && r.foodPercentage === 3;
    case 'many':
      return r !== null && r.foodPercentage === 2;
    case 'few':
      return r !== null && r.foodPercentage === 1;
    case 'empty':
      return r !== null && r.foodPercentage === 0;
  }
}

export function useFridgeSearch(fridges: Fridge[]) {
  const [searchQuery, setSearchQuery] = useState('');

  // React 18 Deferred Value:
  // This tells React to keep the UI perfectly responsive (60fps) when typing,
  // and only calculate the heavy list filter sorting when the main thread is idle.
  // It completely eliminates the need for arbitrary `setTimeout` debounces.
  const deferredQuery = useDeferredValue(searchQuery);
  const isSearching = searchQuery !== deferredQuery;

  const [activeFilters, setActiveFilters] = useState<Set<FilterKey>>(new Set());
  const toggleFilter = useCallback((filter: FilterKey) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filter)) next.delete(filter);
      else next.add(filter);
      return next;
    });
  }, []);

  // Subscribe to center changes via vanilla Zustand subscribe instead of a React selector.
  // This avoids re-rendering BrowsePage on every setCenter call (which fires after every pan).
  // We only trigger a re-render when the user moves more than 1km, and mark it as
  // non-urgent via startTransition so it never blocks map painting.
  const initialCenter = useMapStore.getState().center;
  const lastSortCenter = useRef<[number, number] | null>(initialCenter);
  const [sortCenter, setSortCenter] = useState<[number, number] | null>(
    initialCenter
  );

  const fridgesRef = useRef(fridges);
  useEffect(() => {
    fridgesRef.current = fridges;
  }, [fridges]);

  useEffect(() => {
    let prevSelectedId: string | null = useMapStore.getState().selectedFridgeId;

    return useMapStore.subscribe((state) => {
      // Re-sort around clicked fridge — but deferred by one frame so setView paints first
      if (state.selectedFridgeId && state.selectedFridgeId !== prevSelectedId) {
        prevSelectedId = state.selectedFridgeId;
        const fridge = fridgesRef.current.find(
          (f) => f.id === state.selectedFridgeId
        );
        if (fridge) {
          const coords: [number, number] = [
            fridge.location.geoLat,
            fridge.location.geoLng,
          ];
          lastSortCenter.current = coords;
          setTimeout(() => startTransition(() => setSortCenter(coords)), 300);
        }
        return;
      }
      prevSelectedId = state.selectedFridgeId;

      // Re-sort around map center only when user pans more than 1km
      const newCenter = state.center;
      if (!lastSortCenter.current) {
        lastSortCenter.current = newCenter;
        startTransition(() => setSortCenter(newCenter));
        return;
      }
      const dist = deltaInMeters(newCenter, lastSortCenter.current);
      if (dist > 1000) {
        lastSortCenter.current = newCenter;
        startTransition(() => setSortCenter(newCenter));
      }
    });
  }, []);

  const fuse = useMemo(() => {
    return new Fuse(fridges, {
      keys: ['name', 'location.street', 'location.city', 'location.zip'],
      threshold: 0.3,
      distance: 100,
    });
  }, [fridges]);

  const filteredFridges = useMemo(() => {
    let resultList = fridges;

    // 1. Spatial Sort (Distance from map center)
    // We sort the results dynamically based on whatever the user is looking at.
    // Done BEFORE text filter to ensure when user clears search, closest are at top.
    if (sortCenter && sortCenter.length === 2) {
      resultList = [...resultList].sort((a, b) => {
        const distA = deltaInMeters(sortCenter, [
          a.location.geoLat,
          a.location.geoLng,
        ]);
        const distB = deltaInMeters(sortCenter, [
          b.location.geoLat,
          b.location.geoLng,
        ]);
        return distA - distB;
      });
    }

    // 2. Text Filter (using deferred query)
    if (deferredQuery) {
      resultList = fuse.search(deferredQuery).map((result) => result.item);
    }

    // 3. Two-gate filter:
    //   Ghost gate  — ghost fridges are hidden by default; only shown when explicitly opted in.
    //   Regular gate — non-ghost fridges pass freely when no non-ghost filters are active,
    //                  or must match at least one active non-ghost filter.
    const showGhost = activeFilters.has('ghost');
    const nonGhostFilters = ([...activeFilters] as FilterKey[]).filter(
      (f) => f !== 'ghost'
    );
    resultList = resultList.filter((fridge) => {
      const isGhost = fridge.report?.condition === 'ghost';
      if (isGhost) return showGhost;
      if (nonGhostFilters.length > 0) {
        return nonGhostFilters.some((f) => fridgeMatchesFilter(fridge, f));
      }
      return true;
    });

    return resultList;
  }, [deferredQuery, fuse, fridges, sortCenter, activeFilters]);

  // Filtered but NOT sorted — order is irrelevant for map markers.
  // Keeping this separate means sort-only reorders don't bust React.memo on the map.
  const mapFridges = useMemo(() => {
    let result = fridges;
    if (deferredQuery) {
      result = fuse.search(deferredQuery).map((r) => r.item);
    }
    const showGhost = activeFilters.has('ghost');
    const nonGhostFilters = ([...activeFilters] as FilterKey[]).filter(
      (f) => f !== 'ghost'
    );
    result = result.filter((fridge) => {
      const isGhost = fridge.report?.condition === 'ghost';
      if (isGhost) return showGhost;
      if (nonGhostFilters.length > 0) {
        return nonGhostFilters.some((f) => fridgeMatchesFilter(fridge, f));
      }
      return true;
    });
    return result;
  }, [deferredQuery, fuse, fridges, activeFilters]);

  return {
    searchQuery,
    setSearchQuery,
    filteredFridges,
    mapFridges,
    isSearching,
    activeFilters,
    toggleFilter,
  };
}
