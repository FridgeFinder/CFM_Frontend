import React from 'react';
import { act, render, screen, fireEvent } from '@testing-library/react';
import { FridgeList } from '../FridgeList';
import { Fridge } from 'types/domain';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    prefetch,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => {
    void prefetch;
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  },
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

const observers = new Set<ControlledResizeObserver>();
class ControlledResizeObserver implements ResizeObserver {
  readonly targets = new Set<Element>();
  constructor(readonly callback: ResizeObserverCallback) {
    observers.add(this);
  }
  observe(target: Element) {
    this.targets.add(target);
  }
  unobserve(target: Element) {
    this.targets.delete(target);
  }
  disconnect() {
    this.targets.clear();
    observers.delete(this);
  }
}

const originalResizeObserver = global.ResizeObserver;
const originalScrollTo = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'scrollTo'
);

beforeAll(() => {
  global.ResizeObserver = ControlledResizeObserver;
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
    configurable: true,
    value: jest.fn(function (this: HTMLElement, options: ScrollToOptions) {
      this.scrollTop = options.top ?? this.scrollTop;
    }),
  });
});

afterAll(() => {
  global.ResizeObserver = originalResizeObserver;
  if (originalScrollTo) {
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', originalScrollTo);
  } else {
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo');
  }
});

function measureList(
  height = 640,
  width = 500,
  rowSize: (index: number) => number = () => 320
) {
  fireEvent.scroll(screen.getByRole('list', { name: 'Community fridges' }));
  for (let pass = 0; pass < 3; pass++) {
    act(() => {
      for (const observer of [...observers]) {
        const entries = [...observer.targets].map((target) => {
          const index = target.getAttribute('data-react-window-index');
          const blockSize = index === null ? height : rowSize(Number(index));
          const size = { blockSize, inlineSize: width };
          return {
            target,
            contentRect: new DOMRect(0, 0, width, blockSize),
            borderBoxSize: [size],
            contentBoxSize: [size],
            devicePixelContentBoxSize: [size],
          };
        });
        observer.callback(entries, observer);
      }
    });
  }
}

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

  it('renders a small list in full', () => {
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
    expect(
      screen.queryByRole('link', { name: /update status/i })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /details on test fridge/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /notifications for test fridge/i })
    ).toBeInTheDocument();
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

describe('virtualization', () => {
  const fridges = Array.from({ length: 500 }, (_, index) => ({
    ...baseFridge,
    id: `fridge-${index}`,
    name: `Fridge ${index}`,
  }));
  const rows = () => screen.queryAllByRole('listitem');
  const list = () => screen.getByRole('list', { name: 'Community fridges' });

  it('bounds mounted rows to the viewport plus five on each side', () => {
    render(<FridgeList fridges={fridges} />);
    measureList();
    expect(rows().length).toBeLessThanOrEqual(12);
    expect(screen.queryByText('Fridge 499')).not.toBeInTheDocument();

    fireEvent.scroll(list(), { target: { scrollTop: 320 * 100 + 10 } });
    measureList();
    expect(screen.getByText('Fridge 100')).toBeInTheDocument();
    expect(screen.queryByText('Fridge 0')).not.toBeInTheDocument();
    expect(rows()).toHaveLength(13); // Three intersecting rows plus ten overscan.
    expect(rows()[0]).toHaveAttribute('aria-posinset', '96');
    expect(rows()[0]).toHaveAttribute('aria-setsize', '500');

    fireEvent.scroll(list(), { target: { scrollTop: 0 } });
    measureList();
    expect(screen.getByText('Fridge 0')).toBeInTheDocument();
    expect(screen.queryByText('Fridge 100')).not.toBeInTheDocument();
  });

  it('reaches the final row and preserves bottom breathing room', () => {
    render(<FridgeList fridges={fridges} />);
    measureList();
    fireEvent.scroll(list(), { target: { scrollTop: 320 * 499 } });
    measureList(640, 500, (index) => (index === 499 ? 440 : 320));
    const lastRow = screen.getByText('Fridge 499').closest('[role="listitem"]');
    expect(lastRow).toHaveAttribute('aria-posinset', '500');
    expect(lastRow?.lastElementChild).toHaveStyle({
      height: '120px',
    });
    expect(screen.queryByText('Fridge 0')).not.toBeInTheDocument();
  });

  it('resets for changed results and explicit search/filter keys, not equivalent data', () => {
    const { rerender } = render(
      <FridgeList fridges={fridges} resetKey="initial" />
    );
    measureList();
    fireEvent.scroll(list(), { target: { scrollTop: 3200 } });
    rerender(<FridgeList fridges={[...fridges]} resetKey="initial" />);
    expect(list().scrollTop).toBe(3200);

    rerender(<FridgeList fridges={fridges} resetKey="new-filter" />);
    expect(list().scrollTop).toBe(0);
    fireEvent.scroll(list(), { target: { scrollTop: 3200 } });
    rerender(
      <FridgeList fridges={[...fridges].reverse()} resetKey="new-filter" />
    );
    measureList();
    expect(list().scrollTop).toBe(0);
    expect(screen.getByText('Fridge 499')).toBeInTheDocument();

    rerender(<FridgeList fridges={fridges.slice(0, 1)} />);
    measureList();
    expect(rows()).toHaveLength(1);
    rerender(<FridgeList fridges={[]} />);
    expect(rows()).toHaveLength(0);
    expect(list().scrollTop).toBe(0);
  });

  it('remeasures variable heights after report and viewport width changes', () => {
    const data = fridges.slice(0, 20);
    const { rerender } = render(<FridgeList fridges={data} />);
    measureList(640, 500, (index) => (index % 2 ? 400 : 240));
    expect(rows()[1]).toHaveStyle({ transform: 'translateY(240px)' });
    expect(rows()[2]).toHaveStyle({ transform: 'translateY(640px)' });

    const updated = data.map((fridge, index) =>
      index === 0 ? { ...fridge, report: null } : fridge
    );
    rerender(<FridgeList fridges={updated} />);
    measureList(640, 500, (index) => (index === 0 ? 200 : 400));
    expect(rows()[1]).toHaveStyle({ transform: 'translateY(200px)' });
    expect(screen.getByText('No status')).toBeInTheDocument();

    measureList(640, 300, () => 500);
    expect(rows()[1]).toHaveStyle({ transform: 'translateY(500px)' });
    expect(rows().length).toBeLessThanOrEqual(12);
  });

  it('keeps measured heights when rows are re-sorted', () => {
    const data = fridges.slice(0, 20);
    const { rerender } = render(<FridgeList fridges={data} />);
    measureList(640, 500, (index) => (index % 2 ? 400 : 240));

    // Simulates the distance re-sort after panning the map: no remeasure pass.
    rerender(<FridgeList fridges={[data[1], data[0], ...data.slice(2)]} />);
    expect(rows()[0]).toHaveTextContent('Fridge 1');
    expect(rows()[1]).toHaveStyle({ transform: 'translateY(400px)' });
    expect(rows()[2]).toHaveStyle({ transform: 'translateY(640px)' });
  });

  it('keeps later-row navigation and selection wired after scrolling', () => {
    const onFridgeSelect = jest.fn();
    render(<FridgeList fridges={fridges} onFridgeSelect={onFridgeSelect} />);
    measureList();
    fireEvent.scroll(list(), { target: { scrollTop: 320 * 100 } });
    measureList();
    fireEvent.keyDown(screen.getByRole('button', { name: 'Fridge 100' }), {
      key: 'Enter',
    });
    expect(onFridgeSelect).toHaveBeenCalledWith('fridge-100');
    expect(
      screen.getByRole('link', { name: /details on fridge 100$/i })
    ).toHaveAttribute('href', '/fridge/fridge-100');
    expect(
      screen.getByRole('link', { name: /notifications for fridge 100$/i })
    ).toHaveAttribute(
      'href',
      '/fridge/fridge-100/notifications?name=Fridge%20100&from=browse'
    );
  });

  it('keeps Tab and Shift+Tab inside the list when the adjacent row is unmounted', () => {
    render(<FridgeList fridges={fridges} />);
    measureList();
    const lastRow = rows().at(-1)!;
    const nextPosition = Number(lastRow.getAttribute('aria-posinset')) + 1;
    const lastLink = lastRow.querySelectorAll('a');
    expect(
      fireEvent.keyDown(lastLink[lastLink.length - 1], { key: 'Tab' })
    ).toBe(false);
    measureList();
    expect(
      document.activeElement?.closest('[role="listitem"]')
    ).toHaveAttribute('aria-posinset', String(nextPosition));
    expect(document.activeElement).toHaveAttribute('role', 'button');

    fireEvent.scroll(list(), { target: { scrollTop: 320 * 100 } });
    measureList();
    const firstRow = rows()[0];
    const previousPosition = Number(firstRow.getAttribute('aria-posinset')) - 1;
    expect(
      fireEvent.keyDown(firstRow.querySelector('[role="button"]')!, {
        key: 'Tab',
        shiftKey: true,
      })
    ).toBe(false);
    measureList();
    expect(
      document.activeElement?.closest('[role="listitem"]')
    ).toHaveAttribute('aria-posinset', String(previousPosition));
    expect(document.activeElement).toHaveAttribute(
      'aria-label',
      `Notifications for Fridge ${previousPosition - 1}`
    );
  });
});
