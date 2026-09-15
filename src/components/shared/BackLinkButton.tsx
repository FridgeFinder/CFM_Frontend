'use client';

import React from 'react';
import AnchorLink from 'next/link';
import { Button } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

interface BackLinkButtonProps {
  label: string;
  href: string;
}

export function BackLinkButton({
  label,
  href,
}: BackLinkButtonProps): React.ReactElement {
  return (
    <Button
      component={AnchorLink}
      href={href}
      variant="text"
      startIcon={<ArrowBackIcon />}
      sx={{
        pl: 0,
        mt: 0.5,
        mb: 0.5,
        color: 'primary.main',
        opacity: 0.85,
        textTransform: 'none',
        fontWeight: 600,
        '&:hover': {
          color: 'primary.main',
          opacity: 1,
          bgcolor: 'transparent',
        },
      }}
    >
      {label}
    </Button>
  );
}
