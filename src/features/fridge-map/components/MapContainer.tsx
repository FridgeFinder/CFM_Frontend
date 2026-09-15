'use client';

import React from 'react';
import {
  MapContainer as LeafletMapContainer,
  TileLayer,
  useMap,
} from 'react-leaflet';
import { Box } from '@mui/material';
import { Fridge } from 'types/domain';
import { MarkerLayer } from './layers/MarkerLayer';
import { LegendDrawer } from './LegendDrawer';
import { useMapSync } from '../hooks/useMapSync';
import { useMapStore } from 'store/useMapStore';

interface MapProps {
  fridges: Fridge[];
  onMarkerClick?: (id: string) => void;
  mapRef?: React.RefObject<import('leaflet').Map | null>;
  hideLegend?: boolean;
}

function MapRefCapture({
  mapRef,
}: {
  mapRef: React.RefObject<import('leaflet').Map | null>;
}): null {
  const map = useMap();
  React.useEffect(() => {
    mapRef.current = map;
    return () => {
      mapRef.current = null;
    };
  }, [map, mapRef]);
  return null;
}

const defaultMapCenter: [number, number] = [40.697759, -73.927282];
const defaultZoom = 13.2;

interface MapControllerProps {
  fridges: Fridge[];
}

function MapController({ fridges }: MapControllerProps): null {
  const { locateUser } = useMapSync({ fridges });
  const setCenter = useMapStore((state) => state.setCenter);
  const setZoom = useMapStore((state) => state.setZoom);
  const map = useMap();

  React.useEffect(() => {
    // Auto-locate on mount for browsers that allow it (Chrome, Firefox).
    // Safari silently ignores this — users can tap the crosshair button instead.
    locateUser();

    let moveTimeout: NodeJS.Timeout;
    const handleMoveEnd = () => {
      // Debounce writing map coordinates to Zustand so the map doesn't get flooded with state updates
      clearTimeout(moveTimeout);
      moveTimeout = setTimeout(() => {
        const newCenter = map.getCenter();
        setCenter([newCenter.lat, newCenter.lng]);
        setZoom(map.getZoom());
      }, 500);
    };

    map.on('moveend', handleMoveEnd);

    return () => {
      map.off('moveend', handleMoveEnd);
      clearTimeout(moveTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export function MapContainer({
  fridges,
  onMarkerClick,
  mapRef,
  hideLegend = false,
}: MapProps): React.ReactElement | null {
  const [lng, setLng] = React.useState('en');
  const [isClient, setIsClient] = React.useState(false);
  const initialCenter = useMapStore((state) => state.center);
  const initialZoom = useMapStore((state) => state.zoom);

  React.useEffect(() => {
    setIsClient(true);
    // Only runs on the client. Extracts the ?lng= param from the URL if present.
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setLng(params.get('lng') || 'en');
    }
  }, []);

  if (!isClient) {
    return null; // Wait for hydration to ensure Zustand store loads persisted state correctly
  }

  return (
    <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
      <LeafletMapContainer
        style={{ height: '100%' }}
        center={initialCenter || defaultMapCenter}
        zoom={initialZoom || defaultZoom}
        minZoom={1}
        scrollWheelZoom={true}
        zoomControl={false}
      >
        {mapRef && <MapRefCapture mapRef={mapRef} />}
        <MapController fridges={fridges} />
        <TileLayer
          attribution="&copy; Fridge Finder"
          url={`https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=${lng}`}
          maxZoom={19}
          subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
        />
        <MarkerLayer fridges={fridges} onMarkerClick={onMarkerClick} />
      </LeafletMapContainer>
      {!hideLegend && <LegendDrawer />}
    </Box>
  );
}
