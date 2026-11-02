import { redirect } from 'next/navigation';
import CityBrowsePage from '../page';
import BrowsePage from 'features/fridge-map/components/BrowsePage';
import { getBrowseCityCenter } from 'features/fridge-map/config/browseCities';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

jest.mock('features/fridge-map/components/BrowsePage', () => ({
  __esModule: true,
  default: jest.fn(),
}));

it.each([
  ['buffalo', [42.92771778130319, -78.85146118573536]],
  ['detroit', [42.371783, -83.108435]],
  ['omaha', [41.2680653620639, -95.93746886575032]],
] as const)(
  'renders the shared browse view with the exact %s coordinates',
  async (city, center) => {
    const page = await CityBrowsePage({
      params: Promise.resolve({ city }),
    });
    expect(page.type).toBe(BrowsePage);
    expect(page.props).toEqual({
      initialCenter: center,
      initialZoom: city === 'detroit' ? 10 : undefined,
    });
  }
);

it.each(['unknown-city', 'toString', '__proto__', 'constructor'])(
  'redirects an unrecognized city %s to plain browse',
  async (city) => {
    expect(getBrowseCityCenter(city)).toBeUndefined();
    await expect(
      CityBrowsePage({ params: Promise.resolve({ city }) })
    ).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/browse');
  }
);
