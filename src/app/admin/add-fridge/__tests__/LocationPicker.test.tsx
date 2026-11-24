import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AddFridgeForm } from '../AddFridgeForm';

jest.mock('store/useAuthStore', () => ({
  useAuthStore: (selector: (state: object) => unknown) =>
    selector({ user: { getIdToken: async () => 'admin-token' } }),
}));

jest.mock('next/dynamic', () => () => {
  function MockMap({
    position,
    onSelect,
  }: {
    position: [number, number] | null;
    onSelect: (position: [number, number]) => void;
  }) {
    return (
      <div>
        <span data-testid="map-position">{position?.join(',') ?? 'none'}</span>
        <button type="button" onClick={() => onSelect([40.71, -73.98])}>
          Select map location
        </button>
      </div>
    );
  }
  return MockMap;
});

const defaults = {
  name: 'Test Fridge',
  street: '123 Main Street',
  city: 'New York',
  state: 'NY',
  country: 'US',
  zip: '10001',
  geoLat: 40.7,
  geoLng: -73.9,
};

describe('fridge location picker', () => {
  const originalFetch = global.fetch;
  const mockFetch = jest.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('looks up the address, lets the user adjust the pin, and submits the selected coordinates', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ lat: '40.75', lon: '-73.99' }],
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: '1' }) });
    const onSuccess = jest.fn();
    render(<AddFridgeForm defaultValues={defaults} onSuccess={onSuccess} />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Get coordinates from address' })
    );
    await waitFor(() =>
      expect(screen.getByLabelText('Latitude')).toHaveValue(40.75)
    );
    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.searchParams.get('q')).toBe(
      '123 Main Street, New York, NY, 10001, US'
    );
    expect(screen.getByTestId('map-position')).toHaveTextContent(
      '40.75,-73.99'
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Select map location' })
    );
    expect(screen.getByLabelText('Latitude')).toHaveValue(40.71);
    expect(screen.getByLabelText('Longitude')).toHaveValue(-73.98);
    fireEvent.click(screen.getByRole('button', { name: 'Add Fridge' }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith('1'));
    expect(JSON.parse(mockFetch.mock.calls[1][1].body).location).toMatchObject({
      geoLat: 40.71,
      geoLng: -73.98,
    });
  });

  it('updates the map when coordinates are entered manually', () => {
    render(<AddFridgeForm defaultValues={defaults} />);
    fireEvent.change(screen.getByLabelText('Latitude'), {
      target: { value: '41' },
    });
    expect(screen.getByTestId('map-position')).toHaveTextContent('41,-73.9');
  });

  it('shows an error when the address is incomplete or no result is found', async () => {
    render(<AddFridgeForm />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Get coordinates from address' })
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Enter a street and a city or ZIP'
    );
    expect(mockFetch).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Street'), {
      target: { value: '123 Main Street' },
    });
    fireEvent.change(screen.getByLabelText('City'), {
      target: { value: 'New York' },
    });
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
    fireEvent.click(
      screen.getByRole('button', { name: 'Get coordinates from address' })
    );
    expect(await screen.findByText(/No location found/)).toBeInTheDocument();
  });

  it('does not overwrite a pin moved while a lookup is pending', async () => {
    let resolveFetch!: (value: object) => void;
    mockFetch.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
    );
    render(<AddFridgeForm defaultValues={defaults} />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Get coordinates from address' })
    );
    expect(screen.getByRole('button', { name: 'Add Fridge' })).toBeDisabled();
    fireEvent.click(
      screen.getByRole('button', { name: 'Select map location' })
    );
    resolveFetch({
      ok: true,
      json: async () => [{ lat: '40.75', lon: '-73.99' }],
    });
    expect(
      await screen.findByText(/changed during lookup/)
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Latitude')).toHaveValue(40.71);
    expect(screen.getByLabelText('Longitude')).toHaveValue(-73.98);
  });

  it('reports lookup errors without changing the existing location', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503 });
    render(<AddFridgeForm defaultValues={defaults} />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Get coordinates from address' })
    );
    expect(
      await screen.findByText('Address lookup failed (503).')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Latitude')).toHaveValue(40.7);
    expect(screen.getByLabelText('Longitude')).toHaveValue(-73.9);
  });
});
