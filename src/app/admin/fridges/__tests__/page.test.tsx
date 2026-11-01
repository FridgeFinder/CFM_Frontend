import React from 'react';
import '@testing-library/jest-dom';
import {
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from '@testing-library/react';
import AdminFridgesPage from '../page';

const mockFetch = jest.fn();
const originalFetch = global.fetch;

jest.mock('store/useAuthStore', () => ({
  useAuthStore: (
    selector: (state: {
      user: { getIdToken: () => Promise<string> };
    }) => unknown
  ) => selector({ user: { getIdToken: async () => 'admin-token' } }),
}));

const fridge = {
  id: 'fridge & family',
  name: 'Community Fridge',
  notes: 'Fridge description, not report notes',
  latestFridgeReport: {
    condition: 'dirty',
    foodPercentage: 2,
    notes: 'Please clean the shelves.\nFresh produce available.',
  },
};

describe('AdminFridgesPage', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('queries the fridge API and displays linked names and latest report details', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [fridge],
    });

    render(<AdminFridgesPage />);

    expect(
      screen.getByRole('progressbar', { name: 'Loading fridges' })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('link', { name: fridge.name })
    ).toHaveAttribute('href', '/fridge/fridge%20%26%20family');
    expect(mockFetch).toHaveBeenCalledWith(
      '/v1/fridges/',
      expect.objectContaining({
        headers: expect.objectContaining({ Accept: 'application/json' }),
      })
    );
    const table = screen.getByRole('table', { name: 'Fridges' });
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((cell) => cell.textContent)
    ).toEqual([
      'Name',
      'Condition',
      'Food Level',
      'Latest Report Notes',
      'Latest Status Update',
      'Actions',
    ]);
    expect(within(table).getByText('dirty')).toBeInTheDocument();
    expect(within(table).getByText('Many Items')).toBeInTheDocument();
    expect(within(table).queryByText(/\(\d\/3\)/)).not.toBeInTheDocument();
    expect(
      within(table).getByText(/Please clean the shelves/)
    ).toHaveTextContent('Please clean the shelves. Fresh produce available.');
    expect(screen.queryByText(fridge.notes)).not.toBeInTheDocument();
  });

  it('opens the selected fridge editor and updates the table after saving', async () => {
    const editable = {
      ...fridge,
      location: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        geoLat: 40.7,
        geoLng: -73.9,
      },
      maintainer: {},
    };
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [editable] });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: editable.id,
        name: 'Updated Fridge',
        last_edited: '2026-10-31T02:00:00Z',
      }),
    });
    render(<AdminFridgesPage />);
    await screen.findByRole('link', { name: editable.name });
    fireEvent.click(
      screen.getByRole('button', { name: `Edit ${editable.name}` })
    );
    expect(
      screen.getByRole('dialog', { name: 'Edit Fridge' })
    ).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), {
      target: { value: 'Updated Fridge' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    const updatedLink = await screen.findByRole('link', {
      name: 'Updated Fridge',
    });
    expect(updatedLink).toHaveAttribute(
      'href',
      '/fridge/fridge%20%26%20family'
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(screen.getByText('Fridge updated.')).toBeInTheDocument();
    expect(screen.getByText('dirty')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('1 fridge');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('sorts by actual report time in both directions and keeps missing or invalid times last', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [
        { id: 'missing', name: 'Missing Time' },
        {
          id: 'old',
          name: 'Older',
          latestFridgeReport: {
            condition: 'good',
            foodPercentage: 1,
            timestamp: '2026-10-30T10:00:00Z',
          },
        },
        {
          id: 'invalid',
          name: 'Invalid Time',
          latestFridgeReport: {
            condition: 'good',
            foodPercentage: 1,
            timestamp: 'invalid',
          },
        },
        {
          id: 'new',
          name: 'Newer',
          latestFridgeReport: {
            condition: 'dirty',
            foodPercentage: 1,
            timestamp: '2026-10-30T09:00:00-04:00',
          },
        },
        {
          id: 'same',
          name: 'Same Time',
          latestFridgeReport: {
            condition: 'good',
            foodPercentage: 1,
            timestamp: '2026-10-30T10:00:00Z',
          },
        },
      ],
    });

    render(<AdminFridgesPage />);
    await screen.findByRole('link', { name: 'Newer' });
    const names = () =>
      screen.getAllByRole('link').map((link) => link.textContent);
    expect(names()).toEqual([
      'Newer',
      'Older',
      'Same Time',
      'Missing Time',
      'Invalid Time',
    ]);
    expect(
      screen.getByRole('columnheader', { name: 'Latest Status Update' })
    ).toHaveAttribute('aria-sort', 'descending');
    expect(screen.getByText('Invalid timestamp: invalid')).toBeInTheDocument();
    expect(screen.getByText('No timestamp')).toBeInTheDocument();
    expect(
      screen
        .getByRole('link', { name: 'Newer' })
        .closest('tr')
        ?.querySelector('time')
    ).toHaveAttribute('dateTime', '2026-10-30T09:00:00-04:00');
    expect(
      screen
        .getByRole('link', { name: 'Newer' })
        .closest('tr')
        ?.querySelector('time')
    ).toHaveTextContent(
      new Date('2026-10-30T09:00:00-04:00').toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Latest Status Update' })
    );
    expect(names()).toEqual([
      'Older',
      'Same Time',
      'Newer',
      'Missing Time',
      'Invalid Time',
    ]);
    expect(
      screen.getByRole('columnheader', { name: 'Latest Status Update' })
    ).toHaveAttribute('aria-sort', 'ascending');

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Condition' }));
    fireEvent.click(screen.getByRole('option', { name: 'good' }));
    expect(names()).toEqual(['Older', 'Same Time', 'Invalid Time']);
    fireEvent.click(
      screen.getByRole('button', { name: 'Latest Status Update' })
    );
    expect(names()).toEqual(['Older', 'Same Time', 'Invalid Time']);
  });

  it('sorts the entire result before pagination and resets the page when toggled', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () =>
        Array.from({ length: 26 }, (_, index) => ({
          id: `fridge-${index}`,
          name: `Fridge ${index}`,
          latestFridgeReport: {
            condition: 'good',
            foodPercentage: 1,
            timestamp: new Date(Date.UTC(2026, 9, index + 1)).toISOString(),
          },
        })),
    });
    render(<AdminFridgesPage />);
    await screen.findByRole('link', { name: 'Fridge 25' });
    expect(screen.getAllByRole('link')[0]).toHaveTextContent('Fridge 25');
    expect(
      screen.queryByRole('link', { name: 'Fridge 0' })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Go to next page' }));
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Fridge 0' })).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Latest Status Update' })
    );
    expect(screen.getAllByRole('link')).toHaveLength(25);
    expect(screen.getAllByRole('link')[0]).toHaveTextContent('Fridge 0');
    expect(screen.getByText('1–25 of 26')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Fridge 25' })
    ).not.toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('handles missing reports and notes, including an empty food level', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [
        { id: 'missing', name: 'No Report Fridge' },
        { id: 'null', name: 'Null Report Fridge', latestFridgeReport: null },
        {
          id: 'empty',
          name: 'Empty Fridge',
          latestFridgeReport: { condition: 'good', foodPercentage: 0 },
        },
      ],
    });

    render(<AdminFridgesPage />);

    const missingLink = await screen.findByRole('link', {
      name: 'No Report Fridge',
    });
    const missingRow = missingLink.closest('tr')!;
    expect(within(missingRow).getAllByText('No report')).toHaveLength(2);
    expect(within(missingRow).getByText('-')).toBeInTheDocument();
    expect(
      within(screen.getByRole('table')).getAllByText('No report')
    ).toHaveLength(4);
    expect(screen.getByText('Empty')).toBeInTheDocument();
    expect(screen.getByText('good')).toBeInTheDocument();
  });

  it('shows an empty state', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => [] });

    render(<AdminFridgesPage />);

    expect(await screen.findByText('No fridges found.')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('0 fridges');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it.each([
    [
      'HTTP failure',
      () =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        }),
      'API request failed: Internal Server Error',
    ],
    [
      'network failure',
      () => Promise.reject(new Error('Network unavailable')),
      'Network unavailable',
    ],
  ])(
    'shows an error for %s rather than an empty state',
    async (_, response, message) => {
      mockFetch.mockImplementation(response);

      render(<AdminFridgesPage />);

      expect(await screen.findByRole('alert')).toHaveTextContent(message);
      expect(screen.queryByText('No fridges found.')).not.toBeInTheDocument();
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    }
  );

  it('paginates all returned fridges and resets the page when page size changes', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () =>
        Array.from({ length: 26 }, (_, index) => ({
          id: `fridge-${index}`,
          name: `Fridge ${index}`,
        })),
    });

    render(<AdminFridgesPage />);

    await screen.findByRole('link', { name: 'Fridge 0' });
    expect(screen.getAllByRole('link')).toHaveLength(25);
    expect(
      screen.queryByRole('link', { name: 'Fridge 25' })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Go to next page' }));
    expect(screen.getByRole('link', { name: 'Fridge 25' })).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(1);
    fireEvent.mouseDown(
      screen.getByRole('combobox', { name: 'Rows per page:' })
    );
    fireEvent.click(screen.getByRole('option', { name: '50' }));
    expect(screen.getAllByRole('link')).toHaveLength(26);
    expect(screen.getByRole('link', { name: 'Fridge 0' })).toBeInTheDocument();
  });

  it('filters latest report conditions before pagination and resets the page', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [
        ...Array.from({ length: 26 }, (_, index) => ({
          id: `dirty-${index}`,
          name: `Dirty Fridge ${index}`,
          latestFridgeReport: { condition: 'dirty', foodPercentage: 1 },
        })),
        {
          id: 'good',
          name: 'Working Fridge',
          latestFridgeReport: { condition: 'good', foodPercentage: 3 },
        },
      ],
    });

    render(<AdminFridgesPage />);
    await screen.findByRole('link', { name: 'Dirty Fridge 0' });
    expect(screen.getByRole('status')).toHaveTextContent('27 fridges');
    fireEvent.click(screen.getByRole('button', { name: 'Go to next page' }));

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Condition' }));
    fireEvent.click(screen.getByRole('option', { name: 'good' }));
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(
      screen.getByRole('link', { name: 'Working Fridge' })
    ).toBeInTheDocument();
    expect(screen.getByText('1–1 of 1')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('1 fridge');

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Condition' }));
    fireEvent.click(screen.getByRole('option', { name: 'dirty' }));
    expect(screen.getAllByRole('link')).toHaveLength(25);
    expect(screen.getByText('1–25 of 26')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('26 fridges');
    fireEvent.click(screen.getByRole('button', { name: 'Go to next page' }));
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(
      screen.getByRole('link', { name: 'Dirty Fridge 25' })
    ).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Condition' }));
    fireEvent.click(screen.getByRole('option', { name: 'All conditions' }));
    expect(screen.getByText('1–25 of 27')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('27 fridges');
    expect(
      screen.getByRole('link', { name: 'Dirty Fridge 0' })
    ).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('filters missing reports, supports API-specific conditions, and shows no matches', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [
        { id: 'missing', name: 'Missing Report' },
        { id: 'null', name: 'Null Report', latestFridgeReport: null },
        {
          id: 'custom',
          name: 'Custom Condition',
          latestFridgeReport: { condition: 'maintenance', foodPercentage: 0 },
        },
      ],
    });

    render(<AdminFridgesPage />);
    await screen.findByRole('link', { name: 'Missing Report' });

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Condition' }));
    fireEvent.click(screen.getByRole('option', { name: 'No report' }));
    expect(screen.getAllByRole('link')).toHaveLength(2);
    expect(
      screen.queryByRole('link', { name: 'Custom Condition' })
    ).not.toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Condition' }));
    fireEvent.click(screen.getByRole('option', { name: 'maintenance' }));
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(
      screen.getByRole('link', { name: 'Custom Condition' })
    ).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Condition' }));
    fireEvent.click(screen.getByRole('option', { name: 'ghost' }));
    expect(
      screen.getByText('No fridges match the selected condition.')
    ).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('0–0 of 0')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('0 fridges');

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Condition' }));
    fireEvent.click(screen.getByRole('option', { name: 'All conditions' }));
    expect(screen.getAllByRole('link')).toHaveLength(3);
  });
});
