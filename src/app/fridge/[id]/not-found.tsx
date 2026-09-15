'use client';

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import AnchorLink from 'next/link';
import { SentimentDissatisfied as SadIcon } from '@mui/icons-material';

export default function NotFound() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        p: 3,
        textAlign: 'center',
      }}
    >
      <SadIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
      <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
        Fridge Not Found
      </Typography>
      <Typography
        variant="body1"
        sx={{ color: 'text.secondary', mb: 4, maxWidth: 500 }}
      >
        We couldn't find the fridge you're looking for. It may have been removed
        or the link might be broken.
      </Typography>
      <Button
        component={AnchorLink}
        href="/browse"
        variant="contained"
        sx={{ borderRadius: 24, px: 4, py: 1.5, fontWeight: 700 }}
      >
        Return to Map
      </Button>
    </Box>
  );
}
