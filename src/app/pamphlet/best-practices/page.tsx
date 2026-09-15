import React from 'react';
import { Metadata } from 'next';
import { Box, Typography } from '@mui/material';
import { BestPracticesTabs } from './BestPracticesTabs';

export const metadata: Metadata = {
  title: 'Fridge Finder: Best Practices',
};

export default function BestPracticesPage(): React.ReactElement {
  return (
    <Box
      sx={{
        maxWidth: 900,
        mx: 'auto',
        px: { xs: 2, sm: 4 },
        pt: { xs: 4, md: 6 },
        pb: { xs: 4, md: 6 },
      }}
    >
      <Typography variant="h1" sx={{ mb: 2 }}>
        Best Practices
      </Typography>
      <Typography
        variant="body1"
        sx={{ color: 'text.primary', lineHeight: 1.6, mb: 4 }}
      >
        Help keep the fridges safe, clean, and accessible to everyone in the
        neighborhood.
      </Typography>
      <BestPracticesTabs />
    </Box>
  );
}
