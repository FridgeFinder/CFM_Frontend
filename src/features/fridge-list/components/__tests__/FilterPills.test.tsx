import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterPills } from '../FilterPills';
import { FilterKey } from '../../hooks/useFridgeSearch';

// Stub icons — we only care about labels and interaction in these tests
jest.mock('theme/icons', () => ({
  MapLegendPinLocationIcon: () => null,
  MapLegendConditionDirtyIcon: () => null,
  MapLegendConditionOutOfOrderIcon: () => null,
  MapLegendPinNotAtLocationIcon: () => null,
  MapLegendPinGhostIcon: () => null,
  MapLegendPinNoReportIcon: () => null,
}));

const ALL_LABELS = [
  'Full',
  'Many Items',
  'Few Items',
  'Empty',
  'Needs Cleaning',
  'Needs Repairs',
  'No Data Yet',
  'Not at Location',
  'Ghost Fridge',
];

const ALL_KEYS: FilterKey[] = [
  'full',
  'many',
  'few',
  'empty',
  'dirty',
  'out-of-order',
  'no-data',
  'not-at-location',
  'ghost',
];

describe('FilterPills', () => {
  it('renders all 9 filter pills', () => {
    render(<FilterPills activeFilters={new Set()} onToggle={jest.fn()} />);
    ALL_LABELS.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('renders pills in the correct order', () => {
    render(<FilterPills activeFilters={new Set()} onToggle={jest.fn()} />);
    const chips = screen.getAllByRole('button');
    const renderedLabels = chips.map((chip) => chip.textContent);
    expect(renderedLabels).toEqual(ALL_LABELS);
  });

  it.each(ALL_KEYS)(
    'clicking "%s" pill calls onToggle with that key',
    (key) => {
      const onToggle = jest.fn();
      const label = ALL_LABELS[ALL_KEYS.indexOf(key)];
      render(<FilterPills activeFilters={new Set()} onToggle={onToggle} />);

      fireEvent.click(screen.getByText(label));

      expect(onToggle).toHaveBeenCalledTimes(1);
      expect(onToggle).toHaveBeenCalledWith(key);
    }
  );

  it('does not call onToggle when no pill is clicked', () => {
    const onToggle = jest.fn();
    render(<FilterPills activeFilters={new Set()} onToggle={onToggle} />);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('accepts activeFilters without errors', () => {
    const active = new Set<FilterKey>(['full', 'dirty', 'ghost']);
    expect(() =>
      render(<FilterPills activeFilters={active} onToggle={jest.fn()} />)
    ).not.toThrow();
  });

  it('re-renders cleanly when activeFilters changes', () => {
    const onToggle = jest.fn();
    const { rerender } = render(
      <FilterPills activeFilters={new Set()} onToggle={onToggle} />
    );
    rerender(
      <FilterPills
        activeFilters={new Set<FilterKey>(['full'])}
        onToggle={onToggle}
      />
    );
    expect(screen.getByText('Full')).toBeInTheDocument();
  });
});
