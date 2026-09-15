import React from 'react';
import { Metadata } from 'next';
import { Grid, Box } from '@mui/material';
import { PageHero } from 'components/layout';
import { PamphletParagraph, TitleCard } from 'features/marketing';

const pageContent = {
  pageHero: {
    img: {
      src: '/hero/get-involved.webp',
      alt: 'Volunteers in front of a community fridge',
    },
  },
  introParagraph: {
    title: 'Get Involved!',
    body: ['There are many ways to support the future of the fridges.'],
    variant: 'h1' as const,
  },
  titleCards: [
    {
      title: 'Start A Fridge',
      link: '/pamphlet/get-involved/start-a-fridge',
      img: {
        src: '/card/title/startFridge.svg',
        alt: 'A smiling fridge',
      },
    },
    {
      title: 'Become A Driver',
      link: '/pamphlet/get-involved/become-a-driver',
      img: {
        src: '/card/title/becomeDriver.svg',
        alt: 'A car with a smiling face',
      },
    },
    {
      title: 'Donate To A Fridge',
      link: '/pamphlet/get-involved/donate-to-a-fridge',
      img: {
        src: '/card/title/donate.svg',
        alt: 'A smiling piggy bank with a coin being inserted',
      },
    },
    {
      title: 'Source Food',
      link: '/pamphlet/get-involved/source-food',
      img: {
        src: '/card/title/sourceFood.svg',
        alt: 'A smiling bell pepper, tomato, and broccoli',
      },
    },
    {
      title: 'Service Fridges',
      link: '/pamphlet/get-involved/service-fridges',
      img: {
        src: '/card/title/serviceFridge.svg',
        alt: 'A smiling wrench and screwdriver',
      },
    },
    {
      title: 'Join A Community Group',
      link: '/pamphlet/get-involved/join-a-community-group',
      img: {
        src: '/card/title/joinCommunity.svg',
        alt: 'Four hands coming together with a smiling heart in the center',
      },
    },
  ],
};

export const metadata: Metadata = {
  title: 'Fridge Finder: Get Involved',
};

export default function GetInvolvedPage(): React.ReactElement {
  const { pageHero, introParagraph, titleCards } = pageContent;
  return (
    <div>
      <PageHero {...pageHero} />
      <PamphletParagraph
        sx={{
          textAlign: 'center',
          mb: 0,
          '& .MuiTypography-h1': { mt: 4, mb: 2 },
        }}
        {...introParagraph}
      />
      <Box
        sx={{
          px: { xs: 2, sm: 4, md: 6 },
          py: { xs: 4, md: 6 },
          mx: 'auto',
          maxWidth: 1200,
        }}
      >
        <Grid
          container
          spacing={{ xs: 4, sm: 6, md: 8 }}
          justifyContent="center"
        >
          {titleCards.map((card, index) => (
            <Grid
              key={index}
              size={{
                xs: 6,
                sm: 4,
              }}
              display="flex"
              justifyContent="center"
            >
              <TitleCard {...card} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </div>
  );
}
