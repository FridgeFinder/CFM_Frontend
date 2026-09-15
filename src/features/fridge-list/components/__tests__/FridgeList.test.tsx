import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FridgeList } from '../FridgeList';
import { Fridge } from 'types/domain';

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

// Stub custom SVG icons — we only care about text content in these tests
jest.mock('theme/icons', () => ({
  MapLegendPinLocationIcon: () => null,
  MapLegendConditionDirtyIcon: () => null,
  MapLegendConditionOutOfOrderIcon: () => null,
  MapLegendPinNotAtLocationIcon: () => null,
  MapLegendPinGhostIcon: () => null,
  MapLegendPinNoReportIcon: () => null,
}));

const baseFridge: Fridge = {
  id: 'fridge-1',
  name: 'Test Fridge',
  verified: true,
  location: {
    street: '123 Main St',
    city: 'Brooklyn',
    state: 'NY',
    zip: '11201',
    geoLat: 40.7,
    geoLng: -74.0,
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
});

describe('rendering', () => {
  it('renders the fridge name', () => {
    render(<FridgeList fridges={[baseFridge]} />);
    expect(screen.getByText('Test Fridge')).toBeInTheDocument();
  });

  it('renders address as plain text — not wrapped in an anchor', () => {
    render(<FridgeList fridges={[baseFridge]} />);
    const address = screen.getByText('123 Main St, Brooklyn, NY 11201');
    expect(address).toBeInTheDocument();
    expect(address.closest('a')).toBeNull();
  });

  it('renders "View Profile" link pointing to /fridge/:id', () => {
    render(<FridgeList fridges={[baseFridge]} />);
    const link = screen.getByRole('link', { name: /details on test fridge/i });
    expect(link).toHaveAttribute('href', '/fridge/fridge-1');
  });

  it('renders "Update Status" link with correct base path and query params', () => {
    render(<FridgeList fridges={[baseFridge]} />);
    const link = screen.getByRole('link', {
      name: /update status on test fridge/i,
    });
    const href = link.getAttribute('href') ?? '';
    expect(href).toContain('/fridge/fridge-1/report');
    expect(href).toContain('from=');
    expect(href).toContain('name=');
  });

  it('shows the last update date when a report exists', () => {
    render(<FridgeList fridges={[baseFridge]} />);
    expect(screen.getByText(/last update/i)).toBeInTheDocument();
  });

  it('does not show the last update date when report is null', () => {
    render(<FridgeList fridges={[{ ...baseFridge, report: null }]} />);
    expect(screen.queryByText(/last update/i)).not.toBeInTheDocument();
  });

  it('shows "No status" when report is null', () => {
    render(<FridgeList fridges={[{ ...baseFridge, report: null }]} />);
    expect(screen.getByText('No status')).toBeInTheDocument();
  });

  it('renders all fridges in the list', () => {
    const fridge2 = { ...baseFridge, id: 'fridge-2', name: 'Second Fridge' };
    render(<FridgeList fridges={[baseFridge, fridge2]} />);
    expect(screen.getByText('Test Fridge')).toBeInTheDocument();
    expect(screen.getByText('Second Fridge')).toBeInTheDocument();
  });

  it('renders an empty list without crashing', () => {
    render(<FridgeList fridges={[]} />);
    // No markers, no errors
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('fridge name interactions', () => {
  it('calls onFridgeSelect with the fridge ID when the name area is clicked', () => {
    const onFridgeSelect = jest.fn();
    render(
      <FridgeList fridges={[baseFridge]} onFridgeSelect={onFridgeSelect} />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onFridgeSelect).toHaveBeenCalledWith('fridge-1');
  });

  it('calls onFridgeSelect when Enter is pressed on the name area', () => {
    const onFridgeSelect = jest.fn();
    render(
      <FridgeList fridges={[baseFridge]} onFridgeSelect={onFridgeSelect} />
    );
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
    expect(onFridgeSelect).toHaveBeenCalledWith('fridge-1');
  });

  it('calls onFridgeSelect when Space is pressed on the name area', () => {
    const onFridgeSelect = jest.fn();
    render(
      <FridgeList fridges={[baseFridge]} onFridgeSelect={onFridgeSelect} />
    );
    fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });
    expect(onFridgeSelect).toHaveBeenCalledWith('fridge-1');
  });

  it('does not throw when onFridgeSelect is not provided', () => {
    render(<FridgeList fridges={[baseFridge]} />);
    expect(() => fireEvent.click(screen.getByRole('button'))).not.toThrow();
  });
});

describe('fridge status display', () => {
  it('shows "Not at location" for that condition', () => {
    const fridge = {
      ...baseFridge,
      report: { ...baseFridge.report!, condition: 'not at location' },
    };
    render(<FridgeList fridges={[fridge]} />);
    expect(screen.getByText('Not at location')).toBeInTheDocument();
  });

  it('shows "Ghost Fridge" for ghost condition', () => {
    const fridge = {
      ...baseFridge,
      report: { ...baseFridge.report!, condition: 'ghost' },
    };
    render(<FridgeList fridges={[fridge]} />);
    expect(screen.getByText('Ghost Fridge')).toBeInTheDocument();
  });

  it('shows "Needs cleaning" for dirty condition', () => {
    const fridge = {
      ...baseFridge,
      report: { ...baseFridge.report!, condition: 'dirty', foodPercentage: 2 },
    };
    render(<FridgeList fridges={[fridge]} />);
    expect(screen.getByText('Needs cleaning')).toBeInTheDocument();
  });

  it('shows "Needs repairs" for out of order condition', () => {
    const fridge = {
      ...baseFridge,
      report: {
        ...baseFridge.report!,
        condition: 'out of order',
        foodPercentage: 1,
      },
    };
    render(<FridgeList fridges={[fridge]} />);
    expect(screen.getByText('Needs repairs')).toBeInTheDocument();
  });
});

describe('notifications link', () => {
  it('renders a notifications link with the fridge id, encoded name, and from=browse', () => {
    render(<FridgeList fridges={[baseFridge]} />);
    const link = screen.getByRole('link', {
      name: /notifications for test fridge/i,
    });
    const href = link.getAttribute('href') ?? '';
    expect(href).toContain('/fridge/fridge-1/notifications');
    expect(href).toContain('name=Test%20Fridge');
    expect(href).toContain('from=browse');
  });
});
