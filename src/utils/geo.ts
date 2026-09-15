/**
 * Distance in meters between two geo coordinates
 *
 * From https://stackoverflow.com/questions/43167417/calculate-distance-between-two-points-in-leaflet
 * By https://stackoverflow.com/users/4496505/gaurav-mukherjee
 */
export function deltaInMeters(
  origin: [number, number],
  destination: [number, number]
): number {
  const lon1 = toRadian(origin[1]);
  const lat1 = toRadian(origin[0]);
  const lon2 = toRadian(destination[1]);
  const lat2 = toRadian(destination[0]);

  const deltaLat = lat2 - lat1;
  const deltaLon = lon2 - lon1;

  const a =
    Math.pow(Math.sin(deltaLat / 2), 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(deltaLon / 2), 2);
  const c = 2 * Math.asin(Math.sqrt(a));
  const EARTH_RADIUS = 6371;
  return c * EARTH_RADIUS * 1000;
}

function toRadian(degree: number): number {
  return (degree * Math.PI) / 180;
}
