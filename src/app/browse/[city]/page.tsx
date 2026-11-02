import { redirect } from 'next/navigation';
import BrowsePage from 'features/fridge-map/components/BrowsePage';
import { getBrowseCityCenter } from 'features/fridge-map/config/browseCities';

export default async function CityBrowsePage({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<React.ReactElement> {
  const { city } = await params;
  const center = getBrowseCityCenter(city);
  if (!center) {
    redirect('/browse');
  }
  return (
    <BrowsePage
      key={city}
      initialCenter={center}
      initialZoom={city === 'detroit' ? 10 : undefined}
    />
  );
}
