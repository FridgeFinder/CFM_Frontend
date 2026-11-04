export interface BrowseCity {
  name: string;
  state: string;
  center: [number, number];
}

export const browseCities = {
  buffalo: {
    name: 'Buffalo',
    state: 'New York',
    center: [42.92771778130319, -78.85146118573536],
  },
  detroit: {
    name: 'Detroit',
    state: 'Michigan',
    center: [42.371783, -83.108435],
  },
  omaha: {
    name: 'Omaha',
    state: 'Nebraska',
    center: [41.2680653620639, -95.93746886575032],
  },
} satisfies Record<string, BrowseCity>;

export function getBrowseCity(city: string): BrowseCity | undefined {
  if (Object.hasOwn(browseCities, city)) {
    return browseCities[city as keyof typeof browseCities];
  }
  return undefined;
}
