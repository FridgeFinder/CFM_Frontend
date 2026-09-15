import { useEffect, useCallback, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { Fridge } from 'types/domain';
import { deltaInMeters } from 'utils/geo';
import { useMapStore } from 'store/useMapStore';

interface UseMapSyncProps {
  fridges: Fridge[];
}

function createUserIcon(heading: number | null): L.DivIcon {
  // If heading exists, we render a little directional cone/arrow, otherwise just the blue dot.
  const transform =
    heading !== null && !isNaN(heading)
      ? `rotate(${heading}deg)`
      : 'rotate(0deg)';
  const arrowHtml =
    heading !== null && !isNaN(heading)
      ? `<div style="position: absolute; top: -10px; left: 50%; width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 12px solid rgba(21, 67, 212, 0.85); transform: translateX(-50%);"></div>`
      : '';

  return L.divIcon({
    className: 'user-location-marker',
    html: `
      <div style="position: relative; width: 24px; height: 24px; transform: ${transform}; transform-origin: center center; transition: transform 0.2s linear;">
        ${arrowHtml}
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 16px; height: 16px; background-color: #1543D4; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 6px rgba(0,0,0,0.4); z-index: 2;"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export function useMapSync({ fridges }: UseMapSyncProps) {
  const map = useMap();
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userAccuracyRef = useRef<L.Circle | null>(null);
  const isFirstLocationFound = useRef(true);
  const setUserLocation = useMapStore((state) => state.setUserLocation);
  const userLocation = useMapStore((state) => state.userLocation);
  const selectedFridgeId = useMapStore((state) => state.selectedFridgeId);

  const fridgesRef = useRef(fridges);
  const selectedFridgeIdRef = useRef(selectedFridgeId);

  useEffect(() => {
    fridgesRef.current = fridges;
  }, [fridges]);

  useEffect(() => {
    selectedFridgeIdRef.current = selectedFridgeId;
  }, [selectedFridgeId]);

  const lastFlyToId = useRef<string | null>(null);

  useEffect(() => {
    // Only fly to a fridge IF the user manually requested it and we haven't already flown to it
    if (selectedFridgeId && selectedFridgeId !== lastFlyToId.current) {
      const fridge = fridgesRef.current.find((f) => f.id === selectedFridgeId);
      if (fridge) {
        lastFlyToId.current = selectedFridgeId;
        map.setView(
          [fridge.location.geoLat, fridge.location.geoLng],
          Math.max(map.getZoom(), 13)
        );
      }
    } else if (!selectedFridgeId) {
      lastFlyToId.current = null;
    }
  }, [selectedFridgeId, map]);

  const onLocationFound = useCallback(
    (e: L.LocationEvent) => {
      const userPosition = e.latlng;
      const radius = e.accuracy / 2;
      const heading = e.heading; // degrees (0 to 360) if device supports it, otherwise null

      // Update marker and accuracy circle
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng(userPosition);
        userMarkerRef.current.setIcon(createUserIcon(heading || null));
      } else {
        userMarkerRef.current = L.marker(userPosition, {
          icon: createUserIcon(heading || null),
          zIndexOffset: -100, // Render below fridge markers
        }).addTo(map);
      }

      if (userAccuracyRef.current) {
        userAccuracyRef.current.setLatLng(userPosition);
        userAccuracyRef.current.setRadius(radius);
      } else {
        userAccuracyRef.current = L.circle(userPosition, {
          radius: radius,
          color: '#1543D4',
          fillOpacity: 0.15,
          weight: 1,
        }).addTo(map);
      }

      setUserLocation([userPosition.lat, userPosition.lng]);

      // Only fly automatically on the very first location found
      if (isFirstLocationFound.current) {
        isFirstLocationFound.current = false;

        // If they already have a selected fridge, let that logic handle the pan
        if (selectedFridgeIdRef.current) return;

        const defaultCenter: [number, number] = [40.697759, -73.927282];
        const maxDistMeters = 200000;

        const dist = deltaInMeters(defaultCenter, [
          userPosition.lat,
          userPosition.lng,
        ]);

        if (dist <= maxDistMeters) {
          map.flyTo(userPosition, 14, { animate: false }); // Start without heavy animation on load
        } else {
          // Find nearest fridge if user is too far from NYC
          let nearest: Fridge | null = null;
          let minDist = Infinity;

          fridgesRef.current.forEach((f) => {
            const d = deltaInMeters(
              [userPosition.lat, userPosition.lng],
              [f.location.geoLat, f.location.geoLng]
            );
            if (d < minDist) {
              minDist = d;
              nearest = f;
            }
          });

          if (nearest) {
            const bounds = L.latLngBounds(userPosition, [
              (nearest as Fridge).location.geoLat,
              (nearest as Fridge).location.geoLng,
            ]);
            map.fitBounds(bounds, {
              padding: [50, 50],
              maxZoom: 14,
              animate: false,
            });
          } else {
            // If no nearest fridge found (empty list?), just fly to user
            map.flyTo(userPosition, 14, { animate: false });
          }
        }
      }
    },
    [map, setUserLocation]
  );

  useEffect(() => {
    let errorCount = 0;

    const onLocationError = (e: L.ErrorEvent) => {
      errorCount++;

      // Only log the first few errors to prevent terminal/console spam
      if (errorCount <= 2) {
        console.warn('Geolocation failed or blocked by browser:', e.message);
      }

      // Fallback: stop watching ONLY if the user explicitly denied permission (code 1)
      if (e.code === 1) {
        map.stopLocate();
      }

      // Let Leaflet keep trying in the background for timeouts (code 3) or unavailable (code 2),
      // but we don't force panning or show obnoxious errors.
    };

    map.on('locationfound', onLocationFound);
    map.on('locationerror', onLocationError);

    return () => {
      map.off('locationfound', onLocationFound);
      map.off('locationerror', onLocationError);
      map.stopLocate(); // Ensure we clean up any active watches when component unmounts
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (userAccuracyRef.current) {
        userAccuracyRef.current.remove();
        userAccuracyRef.current = null;
      }
    };
  }, [map, onLocationFound]);

  const locateUser = useCallback(() => {
    const isSecureContext =
      window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    if (isSecureContext) {
      map.stopLocate();
      // Start watching user location continuously.
      map.locate({
        watch: true,
        enableHighAccuracy: true, // Need true for mobile devices to supply directional heading
        timeout: 10000,
        maximumAge: 15000,
        setView: false, // Don't auto-pan on every single tiny GPS update
      });
    } else {
      console.warn(
        'Geolocation is disabled on insecure contexts (HTTP). User location dot will not render.'
      );
    }
  }, [map]);

  return { locateUser };
}
