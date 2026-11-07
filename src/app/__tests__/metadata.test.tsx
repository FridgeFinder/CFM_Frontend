import { metadata as homeMetadata } from '../page';
import { metadata as browseMetadata } from '../browse/page';
import ProfileLayout, { metadata as profileMetadata } from '../profile/layout';

jest.mock('components/layout', () => ({}));
jest.mock('features/marketing', () => ({}));
jest.mock('features/fridge-map/components/BrowsePage', () => ({
  __esModule: true,
  default: jest.fn(),
}));

it('gives the homepage a descriptive title and description', () => {
  expect(homeMetadata).toEqual({
    title: 'Fridge Finder | Find Community Fridges Near You',
    description:
      'Find community fridges near you, explore the map, and learn how to donate food or get involved with your local community.',
  });
});

it('gives plain browse its own title without setting metadata for child city routes', () => {
  expect(browseMetadata).toEqual({
    title: 'Community Fridge Map | Fridge Finder',
    description:
      'Explore community fridge locations on an interactive map, with the latest reported food availability and fridge conditions.',
  });
});

it('gives the private profile a distinct title and keeps it out of search', () => {
  expect(profileMetadata).toEqual({
    title: 'Your Profile | Fridge Finder',
    description:
      'View your Fridge Finder profile and community fridge activity.',
    robots: { index: false, follow: true },
  });
  expect(ProfileLayout({ children: 'profile content' })).toBe(
    'profile content'
  );
});
