'use client';

import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { AddFridgeForm } from './AddFridgeForm';

export default function AddFridgePage(): React.ReactElement {
  return (
    <Box sx={{ width: '100%', px: { xs: 2, sm: 4 }, py: { xs: 3, md: 5 } }}>
      <Box sx={{ width: '100%', maxWidth: 760 }}>
        <Stack spacing={4}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
              Add Fridge
            </Typography>
          </Box>

          <AddFridgeForm />
        </Stack>
      </Box>
    </Box>
  );
}
