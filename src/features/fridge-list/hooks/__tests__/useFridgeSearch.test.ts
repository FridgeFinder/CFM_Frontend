import { renderHook, act } from '@testing-library/react';
import { useFridgeSearch } from '../useFridgeSearch';
import { Fridge } from 'types/domain';

jest.mock('store/useMapStore', () => ({
  useMapStore: Object.assign(jest.fn(), {
    getState: jest.fn(() => ({ center: null, selectedFridgeId: null })),
    subscribe: jest.fn(() => jest.fn()), // returns no-op unsubscribe
  }),
}));

const makeLocation = () => ({
  street: '1 Main St',
  city: 'Brooklyn',
  state: 'NY',
  zip: '11201',
  geoLat: 40.7,
  geoLng: -74.0,
});

const makeReport = (condition: string, foodPercentage: number) => ({
  fridgeId: 'x',
  timestamp: '2024-01-01T00:00:00Z',
  condition,
  foodPercentage,
});

const FRIDGES: Fridge[] = [
  {
    id: '1',
    name: 'Full Fridge',
    verified: true,
    location: makeLocation(),
    maintainer: {},
    report: makeReport('good', 3),
  },
  {
    id: '2',
    name: 'Many Fridge',
    verified: true,
    location: makeLocation(),
    maintainer: {},
    report: makeReport('good', 2),
  },
  {
    id: '3',
    name: 'Few Fridge',
    verified: true,
    location: makeLocation(),
    maintainer: {},
    report: makeReport('good', 1),
  },
  {
    id: '4',
    name: 'Empty Fridge',
    verified: true,
    location: makeLocation(),
    maintainer: {},
    report: makeReport('good', 0),
  },
  {
    id: '5',
    name: 'Dirty Fridge',
    verified: true,
    location: makeLocation(),
    maintainer: {},
    report: makeReport('dirty', 0),
  },
  {
    id: '6',
    name: 'Out of Order Fridge',
    verified: true,
    location: makeLocation(),
    maintainer: {},
    report: makeReport('out of order', 0),
  },
  {
    id: '7',
    name: 'Not at Location Fridge',
    verified: true,
    location: makeLocation(),
    maintainer: {},
    report: makeReport('not at location', 0),
  },
  {
    id: '8',
    name: 'No Data Fridge',
    verified: true,
    location: makeLocation(),
    maintainer: {},
    report: null,
  },
  {
    id: '9',
    name: 'Ghost Fridge',
    verified: true,
    location: makeLocation(),
    maintainer: {},
    report: makeReport('ghost', 0),
  },
];

function ids(fridges: Fridge[]) {
  return fridges.map((f) => f.id).sort();
}

describe('toggleFilter', () => {
  it('adds a filter to activeFilters', () => {
    const { result } = renderHook(() => useFridgeSearch(FRIDGES));
    expect(result.current.activeFilters.size).toBe(0);

    act(() => {
      result.current.toggleFilter('full');
    });

    expect(result.current.activeFilters.has('full')).toBe(true);
    expect(result.current.activeFilters.size).toBe(1);
  });

  it('removes a filter when toggled again', () => {
    const { result } = renderHook(() => useFridgeSearch(FRIDGES));

    act(() => {
      result.current.toggleFilter('full');
    });
    act(() => {
      result.current.toggleFilter('full');
    });

    expect(result.current.activeFilters.has('full')).toBe(false);
    expect(result.current.activeFilters.size).toBe(0);
  });

  it('can hold multiple filters simultaneously', () => {
    const { result } = renderHook(() => useFridgeSearch(FRIDGES));

    act(() => {
      result.current.toggleFilter('full');
      result.current.toggleFilter('dirty');
    });

    expect(result.current.activeFilters.has('full')).toBe(true);
    expect(result.current.activeFilters.has('dirty')).toBe(true);
  });
});

describe('no active filters', () => {
  it('returns all non-ghost fridges by default', () => {
    const { result } = renderHook(() => useFridgeSearch(FRIDGES));
    expect(ids(result.current.filteredFridges)).toEqual(
      ['1', '2', '3', '4', '5', '6', '7', '8'].sort()
    );
  });
});

describe('food level filters', () => {
  it('full — shows only fridges with foodPercentage 3', () => {
    const { result } = renderHook(() => useFridgeSearch(FRIDGES));
    act(() => {
      result.current.toggleFilter('full');
    });
    expect(ids(result.current.filteredFridges)).toEqual(['1']);
  });

  it('many — shows only fridges with foodPercentage 2', () => {
    const { result } = renderHook(() => useFridgeSearch(FRIDGES));
    act(() => {
      result.current.toggleFilter('many');
    });
    expect(ids(result.current.filteredFridges)).toEqual(['2']);
  });

  it('few — shows only fridges with foodPercentage 1', () => {
    const { result } = renderHook(() => useFridgeSearch(FRIDGES));
    act(() => {
      result.current.toggleFilter('few');
    });
    expect(ids(result.current.filteredFridges)).toEqual(['3']);
  });

  it('empty — shows only fridges with foodPercentage 0 (excluding ghost)', () => {
    const { result } = renderHook(() => useFridgeSearch(FRIDGES));
    act(() => {
      result.current.toggleFilter('empty');
    });
    // fridges 4, 5, 6, 7 all have foodPercentage 0 and are non-ghost
    expect(ids(result.current.filteredFridges)).toEqual(
      ['4', '5', '6', '7'].sort()
    );
  });
});

describe('condition filters', () => {
  it('dirty — shows only fridges with condition "dirty"', () => {
    const { result } = renderHook(() => useFridgeSearch(FRIDGES));
    act(() => {
      result.current.toggleFilter('dirty');
    });
    expect(ids(result.current.filteredFridges)).toEqual(['5']);
  });

  it('out-of-order — shows only fridges with condition "out of order"', () => {
    const { result } = renderHook(() => useFridgeSearch(FRIDGES));
    act(() => {
      result.current.toggleFilter('out-of-order');
    });
    expect(ids(result.current.filteredFridges)).toEqual(['6']);
  });

  it('not-at-location — shows only fridges with condition "not at location"', () => {
    const { result } = renderHook(() => useFridgeSearch(FRIDGES));
    act(() => {
      result.current.toggleFilter('not-at-location');
    });
    expect(ids(result.current.filteredFridges)).toEqual(['7']);
  });

  it('no-data — shows only fridges with no report', () => {
    const { result } = renderHook(() => useFridgeSearch(FRIDGES));
    act(() => {
      result.current.toggleFilter('no-data');
    });
    expect(ids(result.current.filteredFridges)).toEqual(['8']);
  });
});

describe('ghost filter (two-gate logic)', () => {
  it('ghost fridges are hidden by default', () => {
    const { result } = renderHook(() => useFridgeSearch(FRIDGES));
    const ghostIds = result.current.filteredFridges.filter((f) => f.id === '9');
    expect(ghostIds).toHaveLength(0);
  });

  it('ghost fridges appear when ghost filter is active', () => {
    const { result } = renderHook(() => useFridgeSearch(FRIDGES));
    act(() => {
      result.current.toggleFilter('ghost');
    });
    expect(ids(result.current.filteredFridges)).toContain('9');
  });

  it('ghost filter does not affect non-ghost fridges', () => {
    const { result } = renderHook(() => useFridgeSearch(FRIDGES));
    act(() => {
      result.current.toggleFilter('ghost');
    });
    // All non-ghost fridges still visible when only ghost filter is active
    expect(ids(result.current.filteredFridges)).toEqual(
      ['1', '2', '3', '4', '5', '6', '7', '8', '9'].sort()
    );
  });

  it('ghost fridges are hidden again after toggling ghost off', () => {
    const { result } = renderHook(() => useFridgeSearch(FRIDGES));
    act(() => {
      result.current.toggleFilter('ghost');
    });
    act(() => {
      result.current.toggleFilter('ghost');
    });
    const ghostIds = result.current.filteredFridges.filter((f) => f.id === '9');
    expect(ghostIds).toHaveLength(0);
  });
});

describe('OR filter logic', () => {
  it('multiple non-ghost filters show fridges matching any of them', () => {
    const { result } = renderHook(() => useFridgeSearch(FRIDGES));
    act(() => {
      result.current.toggleFilter('full');
      result.current.toggleFilter('dirty');
    });
    expect(ids(result.current.filteredFridges)).toEqual(['1', '5'].sort());
  });

  it('non-ghost filter + ghost filter shows matching non-ghost AND ghost fridges', () => {
    const { result } = renderHook(() => useFridgeSearch(FRIDGES));
    act(() => {
      result.current.toggleFilter('full');
      result.current.toggleFilter('ghost');
    });
    expect(ids(result.current.filteredFridges)).toEqual(['1', '9'].sort());
  });
});
