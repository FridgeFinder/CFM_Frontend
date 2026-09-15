import React from 'react';
import Image from 'next/image';
import { Box, Typography, Container } from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';
import { ButtonLink } from 'components/ui';

interface PageHeroProps {
  img: {
    src: string;
    alt: string;
  };
  sx?: SxProps<Theme>;
  title?: string;
  subtitle?: string;
  overlay?: boolean;
  button?: {
    to: string | object;
    'aria-label': string;
    title: string;
    variant?: 'outlined' | 'contained';
  };
}

// Opacity for the hero overlay — lightens the image to improve text/button contrast
const HERO_OVERLAY_OPACITY = 0.3;

export function PageHero({
  img,
  sx,
  title,
  subtitle,
  overlay,
  button,
}: PageHeroProps): React.ReactElement {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: { xs: '50vh', md: '450px' },
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        bgcolor: '#000',
        ...(sx as SxProps<Theme>),
      }}
    >
      <Image
        priority
        fill
        style={{ objectFit: 'cover' }}
        alt={img.alt}
        src={img.src}
      />

      {/* Light overlay to improve button contrast */}
      {overlay && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundColor: `rgba(255, 255, 255, ${HERO_OVERLAY_OPACITY})`,
            zIndex: 0,
          }}
        />
      )}

      <Container
        maxWidth="lg"
        sx={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          px: 3,
          pt: 8,
        }}
      >
        {title && (
          <Typography
            variant="h1"
            sx={{
              color: 'white',
              fontWeight: 800,
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
              letterSpacing: '-0.02em',
              textShadow: '0 4px 12px rgba(0,0,0,0.4)',
              mb: subtitle ? 2 : button ? 4 : 0,
            }}
          >
            {title}
          </Typography>
        )}

        {subtitle && (
          <Typography
            variant="h4"
            sx={{
              color: 'rgba(255,255,255,0.95)',
              fontWeight: 500,
              maxWidth: 800,
              mx: 'auto',
              mb: button ? 4 : 0,
              textShadow: '0 2px 8px rgba(0,0,0,0.4)',
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </Typography>
        )}

        {button && (
          <ButtonLink
            variant={button.variant || 'contained'}
            to={button.to}
            aria-label={button['aria-label']}
            sx={{
              minWidth: { xs: '100%', sm: '300px' },
              mt: title || subtitle ? 2 : 0,
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            }}
            title={button.title}
          />
        )}
      </Container>
    </Box>
  );
}
