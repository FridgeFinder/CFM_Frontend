'use client';

import React from 'react';
import { TileLayer } from 'react-leaflet';

export function MapTileLayer({
  language,
}: {
  language: string;
}): React.ReactElement {
  return (
    <TileLayer
      attribution="&copy; Fridge Finder"
      url={`https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=${language}`}
      maxZoom={19}
      subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
    />
  );
}
