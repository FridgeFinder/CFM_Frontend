import { redirect } from 'next/navigation';
import CityBrowsePage, { generateMetadata } from '../page';
import BrowsePage from 'features/fridge-map/components/BrowsePage';
import { getBrowseCity } from 'features/fridge-map/config/browseCities';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

jest.mock('features/fridge-map/components/BrowsePage', () => ({
  __esModule: true,
  default: jest.fn(),
}));

it.each(['buffalo', 'detroit', 'omaha'])(
  'renders the shared browse view with the %s coordinates',
  async (citySlug) => {
    const city = getBrowseCity(citySlug)!;
    const page = await CityBrowsePage({
      params: Promise.resolve({ city: citySlug }),
    });
    expect(page.type).toBe(BrowsePage);
    expect(page.props).toEqual({
      initialCenter: city.center,
      initialZoom: citySlug === 'detroit' ? 10 : undefined,
    });
  }
);

it.each([
  ['buffalo', 'Buffalo', 'New York'],
  ['detroit', 'Detroit', 'Michigan'],
  ['omaha', 'Omaha', 'Nebraska'],
])(
  'generates accurate canonical and social metadata for %s',
  async (citySlug, cityName, state) => {
    const title = `${cityName} Community Fridge Map | Fridge Finder`;
    const description = `Explore community fridge locations around ${cityName}, ${state} on Fridge Finder's interactive map.`;
    const url = `https://fridgefinder.app/browse/${citySlug}`;

    await expect(
      generateMetadata({ params: Promise.resolve({ city: citySlug }) })
    ).resolves.toEqual({
      title,
      description,
      alternates: { canonical: url },
      openGraph: { type: 'website', url, title, description },
      twitter: { card: 'summary', title, description },
    });
  }
);

it.each(['unknown-city', 'toString', '__proto__', 'constructor'])(
  'redirects an unrecognized city %s to plain browse',
  async (city) => {
    expect(getBrowseCity(city)).toBeUndefined();
    await expect(
      CityBrowsePage({ params: Promise.resolve({ city }) })
    ).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/browse');
  }
);

it('redirects unknown city metadata to plain browse', async () => {
  await expect(
    generateMetadata({ params: Promise.resolve({ city: 'unknown-city' }) })
  ).rejects.toThrow('NEXT_REDIRECT');
  expect(redirect).toHaveBeenCalledWith('/browse');
});
