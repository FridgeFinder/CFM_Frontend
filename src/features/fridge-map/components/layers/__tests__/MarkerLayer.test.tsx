import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Fridge } from 'types/domain';

// --- Mocks ---

// Capture the Leaflet event handlers attached to each marker so tests can
// trigger them directly without a real map.
// Using `var` so the binding is accessible inside the hoisted jest.mock factories.
var capturedEventHandlers: Record<string, (...args: unknown[]) => void> = {};

const mockSetSelectedFridgeId = jest.fn();
let mockSelectedFridgeId: string | null = null;

jest.mock('react-leaflet', () => {
  const React = require('react');
  return {
    Marker: ({
      children,
      eventHandlers,
    }: {
      children: React.ReactNode;
      eventHandlers: Record<string, () => void>;
    }) => {
      capturedEventHandlers = eventHandlers ?? {};
      return React.createElement('div', { 'data-testid': 'marker' }, children);
    },
    Popup: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', { 'data-testid': 'popup' }, children),
    useMap: () => ({
      invalidateSize: jest.fn(),
    }),
  };
});

jest.mock('react-leaflet-cluster', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});

// Leaflet.Icon is instantiated at module level — stub the constructor so jsdom
// doesn't need a real canvas/map context.
jest.mock('leaflet', () => ({
  __esModule: true,
  default: {
    Icon: jest.fn().mockImplementation(() => ({})),
  },
}));

jest.mock('store/useMapStore', () => ({
  useMapStore: (selector: (state: unknown) => unknown) =>
    selector({
      selectedFridgeId: mockSelectedFridgeId,
      setSelectedFridgeId: mockSetSelectedFridgeId,
    }),
}));

// Forward all props so the onClick handler attached by ButtonLink reaches the <a>
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// Stub SVG icon helpers — only the string return values matter for Leaflet
jest.mock('theme/icons', () => ({
  svgDecorationDirty: '',
  svgDecorationOutOfOrder: '',
  svgUrlPinGhost: () => 'ghost.svg',
  svgUrlPinLocation: () => 'pin.svg',
  svgUrlPinNoReport: () => 'no-report.svg',
  svgUrlPinNotAtLocation: () => 'not-at-location.svg',
}));

jest.mock('theme/palette', () => ({
  pinColor: {
    itemsEmpty: '#000',
    itemsFew: '#111',
    itemsMany: '#222',
    itemsFull: '#333',
    reportUnavailable: '#444',
    fridgeNotAtLocation: '#555',
    fridgeGhost: '#666',
    fridgeOperation: '#777',
  },
}));

// Import AFTER mocks are declared
import { MarkerLayer } from '../MarkerLayer';

// --- Test fixtures ---

const baseFridge: Fridge = {
  id: 'fridge-1',
  name: 'The Green Fridge',
  verified: true,
  location: {
    street: '100 Atlantic Ave',
    city: 'Brooklyn',
    state: 'NY',
    zip: '11201',
    geoLat: 40.692,
    geoLng: -73.993,
  },
  maintainer: {},
  report: {
    fridgeId: 'fridge-1',
    timestamp: '2024-01-15T10:30:00.000Z',
    condition: 'good',
    foodPercentage: 2,
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  capturedEventHandlers = {};
  mockSelectedFridgeId = null;
});

// --- Tests ---

describe('rendering', () => {
  it('renders a marker for a fridge with valid coordinates', () => {
    render(<MarkerLayer fridges={[baseFridge]} />);
    expect(screen.getByTestId('marker')).toBeInTheDocument();
  });

  it('does not render a marker when coordinates are missing', () => {
    const noCoords = {
      ...baseFridge,
      location: { ...baseFridge.location, geoLat: 0, geoLng: 0 },
    };
    render(<MarkerLayer fridges={[noCoords]} />);
    expect(screen.queryByTestId('marker')).not.toBeInTheDocument();
  });

  it('renders the fridge name in the popup', () => {
    render(<MarkerLayer fridges={[baseFridge]} />);
    expect(screen.getByText('The Green Fridge')).toBeInTheDocument();
  });

  it('renders the fridge street address in the popup', () => {
    render(<MarkerLayer fridges={[baseFridge]} />);
    expect(screen.getByText(/100 Atlantic Ave/)).toBeInTheDocument();
  });

  it('renders "View Profile" link pointing to /fridge/:id', () => {
    render(<MarkerLayer fridges={[baseFridge]} />);
    const link = screen.getByRole('link', {
      name: /view profile of the green fridge/i,
    });
    expect(link).toHaveAttribute('href', '/fridge/fridge-1');
  });

  it('renders "Update Status" link with the correct fridge id and query params', () => {
    render(<MarkerLayer fridges={[baseFridge]} />);
    const link = screen.getByRole('link', {
      name: /update status of the green fridge/i,
    });
    const href = link.getAttribute('href') ?? '';
    expect(href).toContain('/fridge/fridge-1/report');
    expect(href).toContain('from=');
    expect(href).toContain('name=');
  });

  it('renders multiple markers when given multiple fridges', () => {
    const fridge2 = { ...baseFridge, id: 'fridge-2', name: 'Fridge Two' };
    render(<MarkerLayer fridges={[baseFridge, fridge2]} />);
    expect(screen.getAllByTestId('marker')).toHaveLength(2);
  });
});

describe('marker click handler', () => {
  it('calls onMarkerClick with the fridge ID', () => {
    const onMarkerClick = jest.fn();
    render(
      <MarkerLayer fridges={[baseFridge]} onMarkerClick={onMarkerClick} />
    );
    act(() => {
      capturedEventHandlers.click?.();
    });
    expect(onMarkerClick).toHaveBeenCalledWith('fridge-1');
  });

  it('does not throw when onMarkerClick is not provided', () => {
    render(<MarkerLayer fridges={[baseFridge]} />);
    expect(() =>
      act(() => {
        capturedEventHandlers.click?.();
      })
    ).not.toThrow();
  });
});

describe('popupclose behavior', () => {
  it('calls setSelectedFridgeId(null) when the user manually closes the popup', () => {
    render(<MarkerLayer fridges={[baseFridge]} />);
    act(() => {
      capturedEventHandlers.popupclose?.();
    });
    expect(mockSetSelectedFridgeId).toHaveBeenCalledWith(null);
  });

  it('does NOT call setSelectedFridgeId when popup closes after "View Profile" click', () => {
    render(<MarkerLayer fridges={[baseFridge]} />);
    // Simulate the user clicking the navigation button (sets navigatingFromPopupRef)
    fireEvent.click(
      screen.getByRole('link', { name: /view profile of the green fridge/i })
    );
    // Popup closes due to navigation
    act(() => {
      capturedEventHandlers.popupclose?.();
    });
    expect(mockSetSelectedFridgeId).not.toHaveBeenCalled();
  });

  it('does NOT call setSelectedFridgeId when popup closes after "Update Status" click', () => {
    render(<MarkerLayer fridges={[baseFridge]} />);
    fireEvent.click(
      screen.getByRole('link', { name: /update status of the green fridge/i })
    );
    act(() => {
      capturedEventHandlers.popupclose?.();
    });
    expect(mockSetSelectedFridgeId).not.toHaveBeenCalled();
  });

  it('resets the navigation flag so the NEXT manual close still clears the ID', () => {
    render(<MarkerLayer fridges={[baseFridge]} />);

    // First interaction: navigate from popup
    fireEvent.click(
      screen.getByRole('link', { name: /view profile of the green fridge/i })
    );
    act(() => {
      capturedEventHandlers.popupclose?.();
    });
    jest.clearAllMocks();

    // Second interaction: user manually closes popup — should clear state
    act(() => {
      capturedEventHandlers.popupclose?.();
    });
    expect(mockSetSelectedFridgeId).toHaveBeenCalledWith(null);
  });
});
