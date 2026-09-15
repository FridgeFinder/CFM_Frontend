import React from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { createPortal } from 'react-dom';
import { Box, Fab, Tooltip } from '@mui/material';
import { MyLocation as MyLocationIcon } from '@mui/icons-material';
import { useMapStore } from 'store/useMapStore';
import { useAnalytics } from 'hooks/useAnalytics';

interface LocateUserControlProps {
  position?: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
}

export function LocateUserControl({
  position = 'bottomright',
}: LocateUserControlProps): React.ReactElement | null {
  const map = useMap();
  const [container, setContainer] = React.useState<HTMLDivElement | null>(null);
  const userLocation = useMapStore((state) => state.userLocation);
  const { trackEvent } = useAnalytics();

  React.useEffect(() => {
    const div = L.DomUtil.create('div');
    // We add 'leaflet-control' and 'leaflet-bar' so it looks like a standard Leaflet control
    div.className = 'leaflet-control leaflet-bar';
    div.style.border = 'none'; // We override the border to use MUI's

    const LocateControl = L.Control.extend({
      onAdd: () => div,
      onRemove: () => {},
    });

    const control = new LocateControl({ position });
    control.addTo(map);

    setContainer(div);

    return () => {
      control.remove();
    };
  }, [map, position]);

  const handleLocate = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      trackEvent({
        action: 'map_locate_user',
        category: 'fridge_map',
        label: userLocation ? 'recenter' : 'locate',
      });

      if (userLocation) {
        map.flyTo(userLocation, 15, { animate: true, duration: 1.0 });
        return;
      }

      if (!navigator.geolocation) return;

      // Call navigator.geolocation directly first — Safari requires geolocation to be
      // initiated in the synchronous call stack of a user gesture. Leaflet's map.locate()
      // does internal processing before reaching navigator.geolocation, which can break
      // Safari's gesture chain. This direct call triggers the iOS permission prompt reliably.
      navigator.geolocation.getCurrentPosition(
        () => {
          // Permission granted — start Leaflet's full watch mode so the blue dot appears
          map.stopLocate();
          map.locate({
            watch: true,
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 15000,
            setView: true,
            maxZoom: 15,
          });
        },
        () => {
          // Permission denied or error — nothing to do
        }
      );
    },
    [map, userLocation]
  );

  if (!container) return null;

  return createPortal(
    <Tooltip title="Find my location" placement="left">
      <Box
        onDoubleClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
      >
        <Fab
          onClick={handleLocate}
          size="small"
          aria-label="Find my location"
          sx={{
            backgroundColor: 'white',
            color: userLocation ? 'primary.main' : 'text.secondary',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            width: 40,
            height: 40,
            '&:hover': {
              backgroundColor: '#f0f4ff',
              color: 'primary.main',
            },
          }}
        >
          <MyLocationIcon sx={{ fontSize: 20 }} />
        </Fab>
      </Box>
    </Tooltip>,
    container
  );
}
