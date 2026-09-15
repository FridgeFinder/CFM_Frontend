import React from 'react';
import Image from 'next/image';
import { Box, Typography } from '@mui/material';
import { ButtonLink } from 'components/ui';

export default function NotFound() {
  return (
    <Box
      sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: { xs: 'center', md: 'flex-start' },
        textAlign: 'center',
        px: 2,
        pt: { xs: 0, md: 8 },
        pb: { xs: 9, md: 8 },
      }}
    >
      <Typography
        variant="h1"
        color="text.primary"
        sx={{ mb: 2, fontSize: { xs: '3rem', md: '4rem' } }}
      >
        404
      </Typography>
      <Typography variant="h3" sx={{ mb: 2 }}>
        Oops! Page Not Found
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 6, maxWidth: 500 }}
      >
        The page you are looking for might have been removed, had its name
        changed, or is temporarily unavailable.
      </Typography>
      <ButtonLink
        to="/"
        title="BACK TO HOME"
        aria-label="Return to the home page"
        variant="contained"
        sx={{ minWidth: 200 }}
      />
    </Box>
  );
}
