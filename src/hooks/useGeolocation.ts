import { useState, useCallback } from 'react';

export interface GeoLocation {
  lat: number;
  lng: number;
}

interface UseGeolocationReturn {
  location: GeoLocation | null;
  error: Error | null;
  isLoading: boolean;
  getLocation: () => Promise<GeoLocation>;
}

export function useGeolocation(): UseGeolocationReturn {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getLocation = useCallback((): Promise<GeoLocation> => {
    setIsLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      if (typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setLocation(coords);
            setIsLoading(false);
            resolve(coords);
          },
          (err) => {
            const error = new Error(err.message);
            setError(error);
            setIsLoading(false);
            reject(error);
          }
        );
      } else {
        const err = new Error('Browser does not support geolocation API');
        setError(err);
        setIsLoading(false);
        reject(err);
      }
    });
  }, []);

  return { location, error, isLoading, getLocation };
}
