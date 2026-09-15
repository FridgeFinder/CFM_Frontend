'use client';

import React, { useEffect, useRef } from 'react';
import { Stack, Typography } from '@mui/material';
import { Marker, Popup, useMap } from 'react-leaflet';
import { ButtonLink } from 'components/ui';
import { useAnalytics } from 'hooks/useAnalytics';
import MarkerClusterGroup from 'react-leaflet-cluster';
import Leaflet from 'leaflet';
import { Fridge } from 'types/domain';
import { pinColor } from 'theme/palette';
import { useMapStore } from 'store/useMapStore';
import {
  svgDecorationDirty,
  svgDecorationOutOfOrder,
  svgUrlPinGhost,
  svgUrlPinLocation,
  svgUrlPinNoReport,
  svgUrlPinNotAtLocation,
} from 'theme/icons';

interface MarkerLayerProps {
  fridges: Fridge[];
  onMarkerClick?: (id: string) => void;
}

const colorFrom: Record<number, string> = Object.freeze({
  0: pinColor.itemsEmpty,
  1: pinColor.itemsFew,
  2: pinColor.itemsMany,
  3: pinColor.itemsFull,
});

const decorationFrom: Record<string, string> = Object.freeze({
  good: '',
  dirty: svgDecorationDirty,
  'out of order': svgDecorationOutOfOrder,
});

const iconCache: Record<string, Leaflet.Icon> = {};

function getLeafletIcon(hash: string, svgUrl: string): Leaflet.Icon {
  if (hash in iconCache) {
    return iconCache[hash];
  }
  const icon = new Leaflet.Icon({
    iconUrl: svgUrl,
    popupAnchor: [0, -40],
    iconAnchor: [20, 40],
    iconSize: [40, 40],
  });
  iconCache[hash] = icon;
  return icon;
}

function iconFrom(condition: string, foodPercentage: number): Leaflet.Icon {
  switch (condition) {
    case 'not at location':
      return getLeafletIcon(condition, svgUrlPinNotAtLocation());
    case 'no report':
      return getLeafletIcon(condition, svgUrlPinNoReport());
    case 'ghost':
      return getLeafletIcon(condition, svgUrlPinGhost());
    default:
      return getLeafletIcon(
        condition + foodPercentage,
        svgUrlPinLocation(
          colorFrom[foodPercentage] || colorFrom[0],
          decorationFrom[condition] || ''
        )
      );
  }
}

export function MarkerLayer({
  fridges,
  onMarkerClick,
}: MarkerLayerProps): React.ReactElement {
  const map = useMap();
  const markerRefs = useRef<Map<string, Leaflet.Marker>>(new Map());
  const navigatingFromPopupRef = useRef(false);
  const selectedFridgeId = useMapStore((state) => state.selectedFridgeId);
  const setSelectedFridgeId = useMapStore((state) => state.setSelectedFridgeId);
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    if (!selectedFridgeId) return;
    const id = selectedFridgeId;
    // Use requestAnimationFrame instead of setTimeout(0).
    // setTimeout(0) fires before the browser's layout pass, so Leaflet's
    // invalidateSize() can still read stale dimensions when the map has just
    // remounted (e.g. after navigating back). rAF runs after layout.
    let rafId: number;
    rafId = requestAnimationFrame(() => {
      map.invalidateSize({ pan: false });
      markerRefs.current.get(id)?.openPopup();
    });
    return () => cancelAnimationFrame(rafId);
  }, [selectedFridgeId, map]);

  const markers = React.useMemo(() => {
    return fridges
      .filter((fridge) => fridge.location.geoLat && fridge.location.geoLng)
      .map((fridge) => {
        const { id, name, location, report } = fridge;
        const condition = report?.condition || 'no report';
        const foodPercentage = report?.foodPercentage || 0;

        return (
          <Marker
            key={id}
            position={[location.geoLat, location.geoLng]}
            icon={iconFrom(condition, foodPercentage)}
            ref={(ref) => {
              if (ref) markerRefs.current.set(id, ref);
              else markerRefs.current.delete(id);
            }}
            eventHandlers={{
              click: () => onMarkerClick?.(id),
              popupopen: () => {
                requestAnimationFrame(() => {
                  map.invalidateSize({ pan: false });
                  markerRefs.current.get(id)?.getPopup()?.update();
                });
              },
              popupclose: () => {
                if (navigatingFromPopupRef.current) {
                  navigatingFromPopupRef.current = false;
                  return;
                }
                setSelectedFridgeId(null);
              },
            }}
          >
            <Popup autoPan={false} minWidth={260} maxWidth={320}>
              <Typography
                variant="caption"
                sx={{
                  fontSize: '1.18rem',
                  fontWeight: 700,
                  letterSpacing: 0.5,
                }}
              >
                {name}
              </Typography>
              <br />
              <Typography
                variant="body2"
                component="span"
                sx={{ fontSize: '1rem', margin: 0 }}
              >
                {location.street}
                <br />
                {location.city}, {location.state} {location.zip}
              </Typography>
              <Stack direction="row" spacing={3} sx={{ mt: 3 }}>
                <ButtonLink
                  variant="contained"
                  to={`/fridge/${id}`}
                  aria-label={`View Profile of ${name}`}
                  sx={{ fontSize: '0.85rem', px: 3, py: 1.5 }}
                  style={{ color: 'white' }}
                  title="View Profile"
                  onClick={() => {
                    navigatingFromPopupRef.current = true;
                    trackEvent({
                      action: 'fridge_profile_view',
                      category: 'fridge_browse',
                      label: 'map',
                    });
                  }}
                />
                <ButtonLink
                  variant="contained"
                  to={`/fridge/${id}/report?from=${encodeURIComponent('/browse')}&name=${encodeURIComponent(name)}`}
                  aria-label={`Update status of ${name}`}
                  sx={{ fontSize: '0.85rem', px: 3, py: 1.5 }}
                  style={{ color: 'white' }}
                  title="Update Status"
                  onClick={() => {
                    navigatingFromPopupRef.current = true;
                  }}
                />
              </Stack>
            </Popup>
          </Marker>
        );
      });
  }, [fridges, onMarkerClick, setSelectedFridgeId]);

  return (
    <MarkerClusterGroup
      chunkedLoading
      spiderfyOnMaxZoom={true}
      showCoverageOnHover={false}
      maxClusterRadius={15}
      disableClusteringAtZoom={15}
    >
      {markers}
    </MarkerClusterGroup>
  );
}
