'use client';

import React, { useEffect, useState } from 'react';
import Leaflet from 'leaflet';
import { MapContainer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { MapTileLayer } from 'features/fridge-map/components/MapTileLayer';
import { svgUrlPinLocation } from 'theme/icons';
import { pinColor } from 'theme/palette';

type Coordinates = [number, number];

const defaultCenter: Coordinates = [40.7128, -74.006];
const pinIcon = new Leaflet.Icon({
  iconUrl: svgUrlPinLocation(pinColor.itemsFull, ''),
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

function MapInteraction({
  position,
  lookupVersion,
  onSelect,
}: {
  position: Coordinates | null;
  lookupVersion: number;
  onSelect: (position: Coordinates) => void;
}): null {
  const map = useMap();
  useMapEvents({
    click: (event) => {
      const { lat, lng } = event.latlng.wrap();
      onSelect([Number(lat.toFixed(7)), Number(lng.toFixed(7))]);
    },
  });

  useEffect(() => {
    if (position) {
      map.setView(position, lookupVersion ? 17 : map.getZoom());
    }
    // Only recenter for an address lookup, not each map click or keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lookupVersion, map]);

  useEffect(() => {
    if (position && !map.getBounds().contains(position)) {
      map.panTo(position);
    }
  }, [map, position]);

  return null;
}

export default function LocationMap({
  position,
  lookupVersion,
  onSelect,
}: {
  position: Coordinates | null;
  lookupVersion: number;
  onSelect: (position: Coordinates) => void;
}): React.ReactElement {
  const [language] = useState(
    () => new URLSearchParams(window.location.search).get('lng') || 'en'
  );

  return (
    <MapContainer
      center={position ?? defaultCenter}
      zoom={position ? 17 : 12}
      scrollWheelZoom={false}
      style={{ height: 320, width: '100%' }}
      aria-label="Fridge location map"
    >
      <MapTileLayer language={language} />
      {position && <Marker position={position} icon={pinIcon} />}
      <MapInteraction
        position={position}
        lookupVersion={lookupVersion}
        onSelect={onSelect}
      />
    </MapContainer>
  );
}
