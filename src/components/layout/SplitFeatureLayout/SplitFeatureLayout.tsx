import React from 'react';
import Image from 'next/image';
import { Box, Typography } from '@mui/material';
import { ButtonLink } from 'components/ui';

interface SplitFeatureLayoutProps {
  title: string;
  image: {
    src: string;
    alt: string;
  };
  children: React.ReactNode;
  action?: {
    title: string;
    to: string;
    'aria-label': string;
  };
  imagePosition?: 'left' | 'right';
}

export function SplitFeatureLayout({
  title,
  image,
  children,
  action,
  imagePosition = 'left',
}: SplitFeatureLayoutProps): React.ReactElement {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: {
          xs: 'column',
          md: imagePosition === 'left' ? 'row' : 'row-reverse',
        },
        flexGrow: 1,
        minHeight: 'calc(100vh - 65px)', // Appbar is roughly 65px
        backgroundColor: 'background.default',
      }}
    >
      <Box
        sx={{
          flex: 1,
          position: 'relative',
          minHeight: { xs: '45vh', md: 'auto' },
          backgroundColor: '#000',
        }}
      >
        <Image
          src={image.src}
          alt={image.alt}
          fill
          style={{ objectFit: 'cover', opacity: 0.9 }}
          priority
        />
      </Box>

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          p: { xs: 4, sm: 8, md: 10, lg: 14 },
          backgroundColor: 'background.paper',
        }}
      >
        <Typography
          variant="h1"
          sx={{
            mb: 4,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: 'text.primary',
            fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
            lineHeight: 1.2,
          }}
        >
          {title}
        </Typography>

        <Box sx={{ mb: action ? 6 : 0 }}>{children}</Box>

        {action && (
          <Box>
            <ButtonLink
              title={action.title}
              to={action.to}
              aria-label={action['aria-label']}
              variant="contained"
              sx={{ minWidth: { xs: '100%', sm: 200 } }}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
