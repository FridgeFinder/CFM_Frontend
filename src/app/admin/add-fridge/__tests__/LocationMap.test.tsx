import React from 'react';
import { act, render, screen } from '@testing-library/react';
import LocationMap from '../LocationMap';

const mockSetView = jest.fn();
const mockPanTo = jest.fn();
const mockContains = jest.fn(() => true);
let mockClick: (event: {
  latlng: { wrap: () => { lat: number; lng: number } };
}) => void;
const mockMap = {
  setView: mockSetView,
  panTo: mockPanTo,
  getZoom: () => 12,
  getBounds: () => ({ contains: mockContains }),
};

jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  TileLayer: ({ url, subdomains }: { url: string; subdomains: string[] }) => (
    <div
      data-testid="tiles"
      data-url={url}
      data-subdomains={subdomains.join(',')}
    />
  ),
  Marker: ({ position }: { position: [number, number] }) => (
    <div data-testid="marker">{position.join(',')}</div>
  ),
  useMap: () => mockMap,
  useMapEvents: (events: {
    click: (event: {
      latlng: { wrap: () => { lat: number; lng: number } };
    }) => void;
  }) => {
    mockClick = events.click;
  },
}));

it('renders the pin, recenters on lookup, and reports a map click', () => {
  const onSelect = jest.fn();
  const { rerender } = render(
    <LocationMap
      position={[40.7, -73.9]}
      lookupVersion={0}
      onSelect={onSelect}
    />
  );
  expect(screen.getByTestId('marker')).toHaveTextContent('40.7,-73.9');
  expect(screen.getByTestId('tiles')).toHaveAttribute(
    'data-url',
    'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=en'
  );
  expect(screen.getByTestId('tiles')).toHaveAttribute(
    'data-subdomains',
    'mt0,mt1,mt2,mt3'
  );

  rerender(
    <LocationMap
      position={[40.75, -73.99]}
      lookupVersion={1}
      onSelect={onSelect}
    />
  );
  expect(mockSetView).toHaveBeenLastCalledWith([40.75, -73.99], 17);
  act(() => {
    mockClick({
      latlng: { wrap: () => ({ lat: 40.712345678, lng: -73.987654321 }) },
    });
  });
  expect(onSelect).toHaveBeenCalledWith([40.7123457, -73.9876543]);
});

it('uses the language in the URL for map tiles', () => {
  window.history.replaceState({}, '', '?lng=es');
  render(
    <LocationMap position={null} lookupVersion={0} onSelect={jest.fn()} />
  );
  expect(screen.getByTestId('tiles')).toHaveAttribute(
    'data-url',
    'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=es'
  );
  window.history.replaceState({}, '', '/');
});
