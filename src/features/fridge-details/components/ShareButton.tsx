'use client';

import React from 'react';
import { Button } from '@mui/material';
import { Share as ShareIcon } from '@mui/icons-material';
import { designColor } from 'theme/palette';

interface ShareButtonProps {
  fridgeName: string;
}

export function ShareButton({
  fridgeName,
}: ShareButtonProps): React.ReactElement {
  const [isSharing, setIsSharing] = React.useState(false);

  const handleShare = async (): Promise<void> => {
    if (typeof window === 'undefined' || isSharing) return;

    const pageUrl = window.location.href;

    try {
      setIsSharing(true);

      if (navigator.share) {
        await navigator.share({
          title: fridgeName,
          url: pageUrl,
        });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(pageUrl);
        return;
      }

      window.prompt('Copy this link:', pageUrl);
    } catch (error) {
      // User-cancelled share is an expected flow and should not be treated as a failure.
      if (error instanceof DOMException && error.name === 'AbortError') return;

      // Keep a minimal fallback path for older browsers when sharing fails unexpectedly.
      window.prompt('Copy this link:', pageUrl);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Button
      aria-label="Click to share this page"
      variant="outlined"
      onClick={handleShare}
      sx={{
        borderRadius: '999px',
        fontWeight: 700,
        fontSize: { xs: '0.75rem', md: '1rem' },
        lineHeight: { xs: '1rem', md: '1.25rem' },
        py: { xs: 1.25, md: 1.125 },
        px: { xs: 1.25, md: 1.75 },
        minHeight: { xs: 40, md: 44 },
        border: `2px solid ${designColor.blue.dark}`,
        color: designColor.blue.dark,
        flexShrink: 0,
        minWidth: { xs: 44, md: 48 },
        whiteSpace: 'nowrap',
        '& .MuiSvgIcon-root': { color: designColor.blue.dark },
        '&:hover': {
          backgroundColor: designColor.blue.dark,
          color: designColor.white,
          border: `2px solid ${designColor.blue.dark}`,
          '& .MuiSvgIcon-root': { color: designColor.white },
        },
      }}
    >
      <ShareIcon
        sx={{
          fontSize: { xs: '1rem', md: '1.25rem' },
          color: designColor.blue.dark,
        }}
      />
    </Button>
  );
}
