import React from 'react';
import { Metadata } from 'next';
import { Box } from '@mui/material';
import { PageHero } from 'components/layout';
import { PamphletParagraph } from 'features/marketing';

const pageContent = {
  pageHero: {
    img: {
      src: '/hero/join_a_community_group.webp',
      alt: 'Volunteers resting',
    },
  },
  content: [
    {
      title: 'Join a community group',
      variant: 'h1' as const,
      body: [
        'The fridges near you most likely needs help cleaning and sourcing food. Anyone can participate in running community fridges. You are welcome to organize your own initiatives because operations for community fridges are decentralized and autonomous.',
        'On Fridge Finder, you can find a fridge near you, connect with the location, and share status updates. To collaborate with us behind the scenes, join our engineering or outreach teams.',
      ],
      button: {
        title: 'Volunteer',
        to: '/contact?subject=Volunteer%20Interest',
        'aria-label': 'Volunteer',
        variant: 'contained' as const,
      },
    },
    {
      variant: 'h2' as const,
      title: 'Community groups we recommend',
      body: [
        'There are groups across New York City that source donations and maintenance support for fridges. This is essential to keeping fridges active.',
        'The following organizations have initiatives to support community fridges. To participate, contact the groups that interest you.',
      ],
    },
  ],
};

const organizations = [
  {
    name: 'Artists.Athletes.Activists',
    url: 'https://artists-athletes-activists.org/',
  },
  { name: 'Black Chef Movement', url: 'https://blackchefmovement.org/' },
  {
    name: 'Black Voices Matter',
    url: 'https://www.blackvoicesmatterpledge.org/',
  },
  { name: 'Bushwick Ayuda Mutua ', url: 'https://bushwickayudamutua.com/' },
  {
    name: 'Collective Focus Resource Hub',
    url: 'https://collectivefocus.site/',
  },
  { name: 'Freedge', url: 'https://freedge.org/' },
  { name: 'Nuestra Mesa Brooklyn', url: 'https://www.nuestramesabk.com/' },
  {
    name: 'One Love Community Fridge',
    url: 'https://www.onelovecommunityfridge.org/',
  },
  { name: 'Stuff4Good', url: 'https://officialgoodstuff.com/stuff4good/' },
  { name: 'Universe City', url: 'https://www.universecity.nyc/' },
  { name: 'Woodbine Mutual Aid', url: 'https://www.woodbine.nyc/mutualaid/' },
];

export const metadata: Metadata = {
  title: 'FridgeFinder: Join a community group',
};

export default function JoinACommunityGroupPage(): React.ReactElement {
  const { pageHero, content } = pageContent;
  return (
    <div>
      <PageHero {...pageHero} />

      {content.map((paragraph, index) => (
        <PamphletParagraph
          {...paragraph}
          key={index + '_JoinACommunityGroupPage'}
          hasDivider={index > 0}
        />
      ))}

      <Box
        sx={{
          width: '100%',
          maxWidth: 900,
          mx: 'auto',
          px: { xs: 2, sm: 4 },
          mb: 7,
          boxSizing: 'border-box',
        }}
      >
        <Box
          component="ul"
          sx={{
            paddingLeft: '1.5em',
            fontSize: '1.125rem',
            lineHeight: 1.8,
            '& li': { marginBottom: '8px' },
            '& a': {
              color: 'primary.main',
              textDecoration: 'none',
              fontWeight: 500,
              transition: 'color 0.2s',
              '&:hover': { color: 'primary.dark' },
            },
          }}
        >
          {organizations.map(({ name, url }, index) => (
            <li key={index + '_org'}>
              <a href={url} target="_blank" rel="noreferrer">
                {name}
              </a>
            </li>
          ))}
        </Box>
      </Box>
    </div>
  );
}
