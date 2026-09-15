'use client';

import React from 'react';
import AnchorLink from 'next/link';
import { Button, CircularProgress } from '@mui/material';
import { NotificationsOutlined as NotificationsOutlinedIcon } from '@mui/icons-material';
import { useFridgeNotifications } from 'features/fridge-notifications';
import { useAuthStore } from 'store/useAuthStore';
import { designColor } from 'theme/palette';

interface FollowButtonProps {
  fridgeId: string;
  fridgeName: string;
}

export function FollowButton({
  fridgeId,
  fridgeName,
}: FollowButtonProps): React.ReactElement {
  const authStatus = useAuthStore((s) => s.status);
  const { isFollowing, isInitializing } = useFridgeNotifications(fridgeId);
  const isLoading = authStatus === 'loading' || isInitializing;
  const notificationsHref = `/fridge/${fridgeId}/notifications?name=${encodeURIComponent(fridgeName)}`;

  return (
    <Button
      component={AnchorLink}
      href={notificationsHref}
      aria-label="Click to manage fridge follow alerts"
      variant="contained"
      sx={{
        flex: 0.84,
        borderRadius: '999px',
        fontWeight: 700,
        fontSize: { xs: '0.75rem', md: '1rem' },
        lineHeight: { xs: '1rem', md: '1.25rem' },
        py: { xs: 1.25, md: 1.125 },
        px: { xs: 0.625, md: 1.125 },
        minHeight: { xs: 40, md: 44 },
        backgroundColor: designColor.blue.dark,
        border: `2px solid ${designColor.blue.dark}`,
        whiteSpace: 'nowrap',
        '&:hover': { opacity: 0.9, backgroundColor: designColor.blue.dark },
        textTransform: 'uppercase',
        display: 'flex',
        minWidth: 0,
        gap: { xs: '6px', md: '8px' },
      }}
    >
      {isLoading ? (
        <CircularProgress size={18} sx={{ color: designColor.white }} />
      ) : (
        <>
          <NotificationsOutlinedIcon
            sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}
          />
          {isFollowing ? 'Edit Alerts' : 'Follow'}
        </>
      )}
    </Button>
  );
}
