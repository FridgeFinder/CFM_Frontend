import React from 'react';
import NextLink from 'next/link';
import { Grid, Typography, Box } from '@mui/material';
import { PageHero } from 'components/layout';
import { NewUserWelcomeFlowGate, ParagraphCard } from 'features/marketing';
import { designColor } from 'theme/palette';

const darkButtonSx = {
  '&.MuiButton-outlined': {
    backgroundColor: designColor.blue.dark,
    border: 'none',
    color: 'white',
  },
};
const lightButtonSx = {
  '&.MuiButton-outlined': {
    backgroundColor: designColor.blue.pale,
    border: 'none',
    color: designColor.blue.navy,
  },
};

const pageContent = {
  pageHero: {
    img: {
      src: '/hero/index_3.webp',
      alt: 'Picture of a New York fridge map',
    },
    button: {
      title: 'Find a Fridge',
      to: '/browse',
      'aria-label': 'Browse the fridge map',
      variant: 'contained' as const,
    },
  },
  homepageIntro: {
    title: 'Take what you need. Leave what you can.',
    image: {
      src: '/hero/home_page_fridge.webp',
      alt: 'Community fridge stocked with food',
    },
  },
  paragraphCard: {
    h2: {
      variant: 'h2' as const,
      img: {
        src: '/card/paragraph/pearTomatoAndFridge.svg',
        alt: 'Picture of pear dancing with tomatoes stacked on top of each other',
        width: 125,
        height: 95,
      },
      title: 'About Community Fridges',
      text: 'A community fridge is a decentralized food resource. There are dozens of fridges hosted by volunteers across the New York City area. Fridge Finder makes it easy for people to find fridges and get involved with the community fridge project.',
      link: '/pamphlet/about',
      buttonSx: darkButtonSx,
    },
    h3: [
      {
        variant: 'h3' as const,
        img: {
          src: '/card/paragraph/apple.svg',
          alt: 'Picture of smiling apple holding a list',
          width: 125,
          height: 95,
        },
        title: 'Read Best Practices',
        text: 'Please look over the guidelines for food donation best practices to keep our fridges safe and accessible to all.',
        link: '/pamphlet/best-practices',
        imgMaxWidth: 200,
        buttonTitle: 'Read Guide',
        buttonSx: lightButtonSx,
      },
      {
        variant: 'h3' as const,
        img: {
          src: '/card/paragraph/jumpingBlueberries.svg',
          alt: 'Picture of blueberries jumping and waving',
          width: 125,
          height: 95,
        },
        title: 'Get Involved',
        text: 'There are many ways to get involved with community fridges: from driving, donating food, or starting your own community fridge.',
        link: '/pamphlet/get-involved',
        imgMaxWidth: 200,
        buttonTitle: 'Volunteer',
        buttonSx: darkButtonSx,
      },
      {
        variant: 'h3' as const,
        img: {
          src: '/card/paragraph/plumAndFridge.svg',
          alt: 'Picture of smiling plum and smiling fridge',
          width: 125,
          height: 95,
        },
        title: 'Start a Fridge',
        text: 'Anyone can start a community fridge. Read our guidelines and discover the valuable lessons we learned from hosting two fridges in central New Jersey.',
        link: '/pamphlet/get-involved/start-a-fridge',
        imgMaxWidth: 200,
        buttonTitle: 'Host a Fridge',
        buttonSx: lightButtonSx,
      },
    ],
  },
};

type HomepageIntroProps = typeof pageContent.homepageIntro;

function HomepageIntro({
  title,
  image,
}: HomepageIntroProps): React.ReactElement {
  return (
    <Box
      sx={{
        py: { xs: 3, md: 3 },
        px: { xs: 2, sm: 4 },
      }}
    >
      <Box
        sx={{
          mx: 'auto',
          maxWidth: 1200,
        }}
      >
        <Grid
          container
          alignItems="center"
          spacing={{ xs: 6, md: 4 }}
          justifyContent="space-between"
        >
          <Grid
            size={{
              xs: 12,
              md: 7,
            }}
          >
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '1.75rem', md: '2.75rem' },
                lineHeight: 1.1,
                textAlign: { xs: 'center', md: 'left' },
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: { md: '1.30rem' },
                lineHeight: 1.65,
                mt: 4,
                textAlign: { xs: 'center', md: 'left' },
              }}
            >
              Fridge Finder helps you find community fridges near you. Click{' '}
              <strong>Find A Fridge</strong> to explore the full map. New here?{' '}
              Read our{' '}
              <NextLink
                href="/pamphlet/best-practices"
                style={{ color: designColor.blue.interactive }}
              >
                <strong>Best practices</strong>
              </NextLink>
            </Typography>
          </Grid>

          <Grid
            size={{
              xs: 12,
              md: 5,
            }}
            sx={{
              display: 'flex',
              justifyContent: { xs: 'center', md: 'flex-end' },
            }}
          >
            <Box
              sx={{
                position: 'relative',
                width: { xs: 300, sm: 360, md: 430 },
                height: { xs: 320, sm: 380, md: 430 },
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: { xs: 24, sm: 28, md: 40 },
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: { xs: 230, sm: 275, md: 310 },
                  height: { xs: 230, sm: 275, md: 310 },
                  borderRadius: '50%',
                  backgroundColor: '#F3F4FA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'visible',
                }}
              >
                <Box
                  component="img"
                  src={image.src}
                  alt={image.alt}
                  sx={{
                    width: 'auto',
                    height: { xs: 250, sm: 300, md: 350 },
                    objectFit: 'cover',
                  }}
                />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default function HomePage(): React.ReactElement {
  const { pageHero, homepageIntro, paragraphCard } = pageContent;
  return (
    <>
      <NewUserWelcomeFlowGate />

      <PageHero
        {...pageHero}
        overlay
        sx={{
          height: { xs: '55vh', md: '425px' },
        }}
      />

      <HomepageIntro {...homepageIntro} />

      <Box sx={{ px: { xs: 2, sm: 4 }, mb: 8, mx: 'auto', maxWidth: 1200 }}>
        <Grid container direction="row" justifyContent="center" spacing={4}>
          <Grid
            size={{
              xs: 12,
              md: 10,
              lg: 10,
            }}
          >
            <ParagraphCard {...paragraphCard.h2} variant="h2" />
          </Grid>

          <Grid size={12}>
            <Typography
              variant="h2"
              textAlign="center"
              sx={{ mt: 6, mb: { xs: 2, lg: 4 } }}
            >
              Get involved with community fridges!
            </Typography>
          </Grid>

          <Grid
            container
            direction="row"
            justifyContent="center"
            spacing={4}
            size={12}
          >
            {paragraphCard.h3.map((card, index) => (
              <Grid
                key={card.title}
                size={{
                  xs: 12,
                  sm: 8,
                  md: 4,
                }}
              >
                <ParagraphCard key={'ParagraphCard' + index} {...card} />
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Box>
    </>
  );
}
