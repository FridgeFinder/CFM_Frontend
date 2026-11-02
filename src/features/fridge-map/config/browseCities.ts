export const browseCities = {
  buffalo: [42.92771778130319, -78.85146118573536],
  detroit: [42.371783, -83.108435],
  omaha: [41.2680653620639, -95.93746886575032],
} satisfies Record<string, [number, number]>;

export function getBrowseCityCenter(
  city: string
): [number, number] | undefined {
  if (Object.hasOwn(browseCities, city)) {
    return browseCities[city as keyof typeof browseCities];
  }
  return undefined;
}
