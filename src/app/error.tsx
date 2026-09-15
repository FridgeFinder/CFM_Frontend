'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { Box, Typography, Button, Stack } from '@mui/material';
import { ButtonLink } from 'components/ui';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('App encountered a fatal error:', error);
  }, [error]);

  return (
    <Box
      sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: { xs: 'center', md: 'flex-start' },
        textAlign: 'center',
        maxWidth: 600,
        mx: 'auto',
        pt: { xs: 0, md: 8 },
        pb: { xs: 9, md: 8 },
        px: { xs: 4, md: 6 },
      }}
    >
      <Box sx={{ mb: 4 }}>
        <Image
          src="/card/paragraph/apple.svg"
          alt="Sad or confused apple"
          width={200}
          height={150}
          style={{ objectFit: 'contain' }}
        />
      </Box>
      <Typography variant="h2" sx={{ mb: 2, color: 'error.main' }}>
        Something went wrong!
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 6, maxWidth: 500 }}
      >
        We encountered an unexpected error while trying to process your request,
        please try again or contact us if the problem persists.
      </Typography>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={3}
        sx={{ width: '100%', maxWidth: 400, justifyContent: 'center' }}
      >
        <ButtonLink
          to="/"
          title="BACK TO HOME"
          aria-label="Return to the home page"
          variant="outlined"
          sx={{ flex: 1 }}
        />
        <Button variant="contained" onClick={() => reset()} sx={{ flex: 1 }}>
          TRY AGAIN
        </Button>
      </Stack>
    </Box>
  );
}
