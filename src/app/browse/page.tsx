import type { Metadata } from 'next';
import BrowsePage from 'features/fridge-map/components/BrowsePage';

export const metadata: Metadata = {
  title: 'Community Fridge Map | Fridge Finder',
  description:
    'Explore community fridge locations on an interactive map, with the latest reported food availability and fridge conditions.',
};

export default function Page(): React.ReactElement {
  return <BrowsePage />;
}
