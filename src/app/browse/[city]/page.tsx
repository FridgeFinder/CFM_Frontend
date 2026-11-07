import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import BrowsePage from 'features/fridge-map/components/BrowsePage';
import { getBrowseCity } from 'features/fridge-map/config/browseCities';

const SITE_URL = 'https://fridgefinder.app';

interface CityBrowsePageProps {
  params: Promise<{ city: string }>;
}

function getCityOrRedirect(citySlug: string) {
  const city = getBrowseCity(citySlug);
  if (!city) {
    redirect('/browse');
  }
  return city;
}

export async function generateMetadata({
  params,
}: CityBrowsePageProps): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = getCityOrRedirect(citySlug);
  const title = `${city.name} Community Fridge Map | Fridge Finder`;
  const description = `Explore community fridge locations around ${city.name}, ${city.state} on Fridge Finder's interactive map.`;
  const url = `${SITE_URL}/browse/${citySlug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title,
      description,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default async function CityBrowsePage({
  params,
}: CityBrowsePageProps): Promise<React.ReactElement> {
  const { city: citySlug } = await params;
  const city = getCityOrRedirect(citySlug);
  return (
    <BrowsePage
      key={citySlug}
      initialCenter={city.center}
      initialZoom={
        citySlug === 'detroit' ? 10 : citySlug === 'kingston' ? 14 : undefined
      }
    />
  );
}
