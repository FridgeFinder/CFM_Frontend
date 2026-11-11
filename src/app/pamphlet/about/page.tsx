import React from 'react';
import { Metadata } from 'next';
import NextLink from 'next/link';
import { List, ListItem, Typography } from '@mui/material';
import { PamphletParagraph } from 'features/marketing';
import type { PamphletParagraphProps } from 'features/marketing/components/PamphletParagraph/PamphletParagraph';

export const metadata: Metadata = {
  title: 'Fridge Finder: About Us',
};

const pageContent: { content: PamphletParagraphProps[] } = {
  content: [
    {
      variant: 'h1',
      title: 'Summary',
      body: [
        'Community fridges provide free food to people in need while combating food waste. Outdoor refrigerators serve as access points to life-sustaining nutrition in cities around the world.',
      ],
    },
    {
      img: {
        src: '/paragraph/pamphlet/about/independence_for_each_fridge.webp',
        alt: 'A man in working clothes stands in the hot sun painting the doors of a fridge blue. The a sign with the words "Free Food" hangs on the lintel of the fridge shed.',
        attribution: 'Mr. Moda painting Classon Community Fridge, 2025',
      },
      variant: 'h2',
      title: 'Independence for Each Fridge',
      body: [
        'Community fridges are used by many people everyday, oftentimes working class families, the elderly, and unhoused people looking for an extra food source. A common value is respect for the autonomy of each refrigerator and those who depend on them.',
        'The thousands of fridges in action represent a variety of identities and ethos that are as unique as the neighborhoods that run them. Refrigerators are independent and decentralized. They are operated by local businesses, mutual aid groups, neighbors, and organizations.',
      ],
    },
    {
      variant: 'h2',
      title: 'Public Art on Our Sidewalks',
      body: [
        'The first known community fridge was started in 2014. Since then, artists popularized these public resources by decorating the fridge doors to attract curiosity and welcome participants. This creative element effectively transforms an everyday object into a cultural icon that carries a powerful message about circular economics and mutual aid. As public art installations, fridges generate interest and expand the positive impact of food redistribution.',
      ],
    },
    {
      img: {
        src: '/paragraph/pamphlet/about/technology_empowers_us.webp',
        alt: 'A table on top of which stands a cardboard cutout of the Fridge Finder mascots. On top of the table are printed booklets, a welcome poster, and an iPad on a display stand.',
        attribution: 'FridgeFinder table display, 2025',
      },
      variant: 'h2',
      title: 'Technology Empowers Us',
      body: [
        'A team of organizers and web developers formed in 2022 to create FridgeFinder, a map that tracks community fridges. Our app offers digital tools that empower volunteers to take action. By subscribing to a fridge and leaving status updates, the public strengthens a network of people running fridges. Maintenance is also streamlined and food transportation is mobilized. FridgeFinder shows the incredible everyday contributions of food justice advocates. Our goal as a team is to strengthen the capacity for long-term prosperity at featured locations.',
      ],
    },
    {
      variant: 'h3',
      title: 'Web App',
      body: [
        'Access our interactive map, create a profile, follow local fridges, and post status updates.',
      ],
    },
    {
      variant: 'h3',
      title: 'Mobile App',
      body: [
        'All the features of the web app, plus the ability to attach photos to your status updates.',
      ],
    },
    {
      img: {
        src: '/paragraph/pamphlet/about/support_the_fridges.webp',
        alt: 'Volunteers loading plastic bags containing groceries into the trunk of a SUV.',
        attribution: 'Food donation pick up, 2025',
      },
      variant: 'h2',
      title: 'Support the Fridges',
      body: [
        'The growth and success of this project depends on your contributions. There are many ways to help combat food injustice. Volunteer opportunities are available with FridgeFinder, as well as with individual refrigerators actively recruiting new collaborators.',
      ],
    },
  ],
};

const localizedMaps = [
  { title: 'Detroit, MI Community Fridge Map', href: '/browse/detroit' },
  { title: 'Omaha, NE Community Fridge Map', href: '/browse/omaha' },
  { title: 'Pittsburgh, PA Community Fridge Map', href: '/browse/pittsburgh' },
  { title: 'Kingston, NY Community Fridge Map', href: '/browse/kingston' },
];

export default function AboutPage(): React.ReactElement {
  const { content } = pageContent;
  return (
    <div>
      {content.map((paragraph, index) => (
        <PamphletParagraph
          {...paragraph}
          key={index + '_AboutPage'}
          hasDivider={index > 0}
        />
      ))}
      <PamphletParagraph
        title="Find a Community Fridge Near You"
        variant="h2"
        hasDivider
      >
        <Typography variant="body1" sx={{ lineHeight: 1.7, mb: 2 }}>
          Use the interactive map to locate community refrigerators, drop off
          food donations, and access free food in your neighborhood.
        </Typography>
        <List disablePadding>
          {localizedMaps.map(({ title, href }) => (
            <ListItem key={href} disableGutters>
              <NextLink
                href={href}
                style={{ color: 'inherit', textDecoration: 'underline' }}
              >
                {title}
              </NextLink>
            </ListItem>
          ))}
        </List>
      </PamphletParagraph>
    </div>
  );
}
