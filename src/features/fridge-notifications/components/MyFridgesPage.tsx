'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Box,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  SvgIconProps,
  Typography,
} from '@mui/material';
import {
  LocationOnOutlined as LocationOnOutlinedIcon,
  NotificationsOutlined as NotificationsOutlinedIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';

import { ButtonLink } from 'components/ui';
import { useAuthStore } from 'store/useAuthStore';
import { useFridgeStore } from 'store/useFridgeStore';
import { useFollowingStore } from 'store/useFollowingStore';
import {
  MapLegendConditionDirtyIcon,
  MapLegendConditionOutOfOrderIcon,
  MapLegendPinLocationIcon,
  MapLegendPinNotAtLocationIcon,
  MapLegendPinGhostIcon,
  MapLegendPinNoReportIcon,
} from 'theme/icons';
import { pinColor, designColor } from 'theme/palette';
import { timeAgo } from 'utils/timeAgo';
import { foodLevelConfig } from 'config/foodLevel';
import { UserFridgeNotification, Fridge } from 'types/domain';
import { getAllUserNotifications } from '../utils/fridgeNotificationsApi';

// ---------------------------------------------------------------------------
// Condition badge
// ---------------------------------------------------------------------------

const conditionConfig: Record<
  string,
  { label: string; color: string; Icon: React.ComponentType<SvgIconProps> }
> = {
  dirty: {
    label: 'Needs Cleaning',
    color: designColor.conditionIcon,
    Icon: MapLegendConditionDirtyIcon,
  },
  'out of order': {
    label: 'Needs Repairs',
    color: designColor.conditionIcon,
    Icon: MapLegendConditionOutOfOrderIcon,
  },
  'not at location': {
    label: 'Not at Location',
    color: pinColor.fridgeNotAtLocation,
    Icon: MapLegendPinNotAtLocationIcon,
  },
  ghost: {
    label: 'Unavailable',
    color: pinColor.fridgeGhost,
    Icon: MapLegendPinGhostIcon,
  },
};

function IconLabel({
  icon,
  label,
}: {
  icon: React.ReactElement;
  label: string;
}): React.ReactElement {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
      {icon}
      <Typography
        variant="body2"
        sx={{ fontWeight: 600, color: 'text.secondary' }}
      >
        {label}
      </Typography>
    </Box>
  );
}

function ConditionBadge({
  condition,
}: {
  condition: string;
}): React.ReactElement | null {
  const config = conditionConfig[condition.toLowerCase()];
  if (!config) return null;

  const { Icon, label, color } = config;
  return (
    <IconLabel
      icon={<Icon sx={{ width: 20, height: 20, color }} />}
      label={label}
    />
  );
}

// ---------------------------------------------------------------------------
// Food level badge
// ---------------------------------------------------------------------------

function FoodLevelBadge({
  foodPercentage,
}: {
  foodPercentage: number;
}): React.ReactElement {
  const config = foodLevelConfig[foodPercentage] ?? {
    label: 'Unknown',
    color: pinColor.itemsEmpty,
  };
  return (
    <IconLabel
      icon={
        <MapLegendPinLocationIcon
          sx={{ width: 20, height: 20, color: config.color }}
        />
      }
      label={config.label}
    />
  );
}

// ---------------------------------------------------------------------------
// Fridge card
// ---------------------------------------------------------------------------

function FridgeCard({ fridge }: { fridge: Fridge }): React.ReactElement {
  const { id, name, location, report } = fridge;
  const address = `${location.street}, ${location.city}`;
  const notificationsHref = `/fridge/${id}/notifications?name=${encodeURIComponent(name)}&from=my-fridges`;
  const reportHref = `/fridge/${id}/report?from=${encodeURIComponent('/my-fridges')}&name=${encodeURIComponent(name)}`;
  const profileHref = `/fridge/${id}?from=my-fridges`;

  return (
    <Box>
      <Box sx={{ px: { xs: 2.5, sm: 4 }, py: { xs: 3, sm: 4 } }}>
        {/* Header: name / address + time pill */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 1,
            mb: 1,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: { xs: '1rem', sm: '1.125rem' },
                fontWeight: 700,
                color: designColor.neroGray,
                lineHeight: 1.2,
              }}
            >
              {name}
            </Typography>
            <Stack direction="row" alignItems="center" gap={0.5} sx={{ mt: 1 }}>
              <LocationOnOutlinedIcon
                sx={{
                  fontSize: '1rem',
                  color: 'text.secondary',
                  flexShrink: 0,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {address}
              </Typography>
            </Stack>
          </Box>

          {report && (
            <Box
              sx={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                bgcolor: 'grey.100',
                borderRadius: '999px',
                px: 1.25,
                py: 0.5,
              }}
            >
              <AccessTimeIcon
                sx={{
                  fontSize: { xs: '0.75rem', sm: '0.8rem' },
                  color: 'text.secondary',
                }}
              />
              <Typography
                sx={{
                  fontSize: { xs: '0.6875rem', sm: '0.8rem' },
                  fontWeight: 500,
                  color: 'text.secondary',
                }}
              >
                {timeAgo(new Date(report.timestamp))}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Status badges */}
        {report ? (
          <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 1.5 }}>
            <FoodLevelBadge foodPercentage={report.foodPercentage} />
            <ConditionBadge condition={report.condition} />
          </Stack>
        ) : (
          <Box sx={{ mb: 1.5 }}>
            <IconLabel
              icon={
                <MapLegendPinNoReportIcon
                  sx={{
                    width: 20,
                    height: 20,
                    color: pinColor.reportUnavailable,
                  }}
                />
              }
              label="No status"
            />
          </Box>
        )}

        {/* Action buttons */}
        <Stack direction="row" gap={1}>
          <ButtonLink
            variant="outlined"
            to={profileHref}
            aria-label={`View profile for ${name}`}
            title="VIEW PROFILE"
            sx={{
              flex: 1,
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'none',
              '&.MuiButton-outlined': {
                border: `2px solid ${designColor.borderGray}`,
                color: designColor.secondaryText,
                py: 0.5,
                height: 38,
              },
              '&.MuiButton-outlined:hover': {
                backgroundColor: designColor.blue.dark,
                color: designColor.white,
                border: `2px solid ${designColor.blue.dark}`,
              },
            }}
          />
          <ButtonLink
            variant="contained"
            to={reportHref}
            aria-label={`Update status for ${name}`}
            title="UPDATE STATUS"
            sx={{
              flex: 1,
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'none',
              '&.MuiButton-contained': {
                py: 0.5,
                height: 38,
              },
              backgroundColor: designColor.blue.dark,
              border: `2px solid ${designColor.blue.dark}`,
              '&:hover': {
                opacity: 0.9,
                backgroundColor: designColor.blue.dark,
              },
            }}
          />
          <IconButton
            aria-label={`Edit alerts for ${name}`}
            component={Link}
            href={notificationsHref}
            sx={{
              borderRadius: 3,
              border: `2px solid ${designColor.borderGray}`,
              color: designColor.secondaryText,
              flexShrink: 0,
              width: 38,
              height: 38,
              '&:hover': {
                backgroundColor: designColor.blue.dark,
                color: designColor.white,
                border: `2px solid ${designColor.blue.dark}`,
              },
            }}
          >
            <NotificationsOutlinedIcon sx={{ fontSize: '1.125rem' }} />
          </IconButton>
        </Stack>
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------

function LoadingState(): React.ReactElement {
  return (
    <Box
      sx={{
        alignSelf: 'center',
        width: '100%',
        maxWidth: 650,
        px: { xs: 3.5, sm: 2 },
        pt: { xs: 2, md: 4 },
        pb: { xs: 18, md: 6 },
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 0, mt: 2 }}>
        <Typography
          sx={{
            fontSize: { xs: '1.25rem', sm: '1.5rem' },
            fontWeight: 700,
            color: designColor.neroGray,
            mb: 0.25,
            textAlign: 'center',
          }}
        >
          My Fridges
        </Typography>
      </Box>

      {/* Skeleton cards */}
      <Box>
        {[0, 1, 2].map((i) => (
          <React.Fragment key={i}>
            {i > 0 && <Divider sx={{ borderColor: designColor.whiteSmoke }} />}
            <Box sx={{ px: { xs: 2.5, sm: 4 }, py: { xs: 3, sm: 4 } }}>
              {/* Name + time pill */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  mb: 1,
                }}
              >
                <Box sx={{ flex: 1, mr: 2 }}>
                  <Skeleton variant="text" width="55%" height={26} />
                  <Skeleton
                    variant="text"
                    width="75%"
                    height={18}
                    sx={{ mt: 0.5 }}
                  />
                </Box>
                <Skeleton
                  variant="rounded"
                  width={72}
                  height={24}
                  sx={{ borderRadius: 999, mt: 0.5 }}
                />
              </Box>

              {/* Status badge */}
              <Skeleton
                variant="rounded"
                width={96}
                height={20}
                sx={{ borderRadius: 999, mb: 2 }}
              />

              {/* Action buttons */}
              <Stack direction="row" gap={1}>
                <Skeleton
                  variant="rounded"
                  height={38}
                  sx={{ flex: 1, borderRadius: 999 }}
                />
                <Skeleton
                  variant="rounded"
                  height={38}
                  sx={{ flex: 1, borderRadius: 999 }}
                />
                <Skeleton
                  variant="rounded"
                  width={38}
                  height={38}
                  sx={{ borderRadius: 3, flexShrink: 0 }}
                />
              </Stack>
            </Box>
          </React.Fragment>
        ))}
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Empty / unauthenticated states
// ---------------------------------------------------------------------------

function EmptyState({
  title,
  body,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
}): React.ReactElement {
  return (
    <Box
      sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: { xs: 'center', md: 'flex-start' },
        alignItems: 'center',
        px: 3,
        pt: { xs: 0, md: 8 },
        pb: { xs: 18, md: 4 },
      }}
    >
      <Box sx={{ maxWidth: 360, width: '100%', textAlign: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Image
            src="/card/paragraph/jumpingBlueberries.svg"
            alt="Picture of blueberries jumping and waving"
            width={160}
            height={122}
          />
        </Box>
        <Typography
          variant="h6"
          fontWeight={700}
          sx={{ mb: 1.5, lineHeight: 1.3 }}
        >
          {title}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: 'text.secondary', mb: 4, lineHeight: 1.7 }}
        >
          {body}
        </Typography>
        <ButtonLink
          variant="contained"
          to={ctaHref}
          aria-label={ctaLabel}
          title={ctaLabel}
          sx={{
            borderRadius: '999px',
            px: 6,
            py: 1.25,
            fontWeight: 700,
            fontSize: '0.875rem',
            minWidth: 200,
            backgroundColor: designColor.blue.dark,
            '&:hover': { opacity: 0.9, backgroundColor: designColor.blue.dark },
          }}
        />
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function MyFridgesPage(): React.ReactElement {
  const { user, status: authStatus } = useAuthStore();
  const {
    status: fridgeStatus,
    fetchFridges,
    getFridgeById,
  } = useFridgeStore();
  const {
    notifications,
    status: notifStatus,
    fetch: fetchFollowing,
  } = useFollowingStore();

  useEffect(() => {
    fetchFridges();
  }, [fetchFridges]);

  useEffect(() => {
    fetchFollowing();
  }, [fetchFollowing, user]);

  if (authStatus === 'loading') {
    return <LoadingState />;
  }

  if (authStatus === 'unauthenticated') {
    return (
      <EmptyState
        title="Sign in to view fridges you follow"
        body="Keep track of your favorite community fridges. See their status, manage alerts, and help maintain them."
        ctaLabel="Sign In"
        ctaHref="/auth/signin"
      />
    );
  }

  const isLoading =
    notifStatus === 'loading' ||
    (notifStatus === 'idle' && authStatus === 'authenticated') ||
    fridgeStatus === 'loading' ||
    fridgeStatus === 'idle';

  if (isLoading) {
    return <LoadingState />;
  }

  const followedFridges = notifications
    .map((n) => getFridgeById(n.fridgeId))
    .filter((f): f is Fridge => f !== undefined);

  if (followedFridges.length === 0) {
    return (
      <EmptyState
        title="You're not following any fridges yet"
        body="Follow community fridges to start receiving notifications about food levels, conditions, and more."
        ctaLabel="Find Fridges Near You"
        ctaHref="/browse"
      />
    );
  }

  return (
    <Box
      sx={{
        alignSelf: 'center',
        width: '100%',
        maxWidth: 650,
        px: { xs: 1, sm: 2 },
        pt: { xs: 2, md: 4 },
        pb: { xs: 18, md: 6 },
      }}
    >
      <Box sx={{ mb: 0, mt: 1 }}>
        <Typography
          sx={{
            fontSize: { xs: '1.25rem', sm: '1.5rem' },
            fontWeight: 700,
            color: designColor.neroGray,
            mb: 0.25,
            textAlign: 'center',
          }}
        >
          My Fridges
        </Typography>
      </Box>

      <Box>
        {followedFridges.map((fridge, i) => (
          <React.Fragment key={fridge.id}>
            {i > 0 && <Divider sx={{ borderColor: designColor.whiteSmoke }} />}
            <FridgeCard fridge={fridge} />
          </React.Fragment>
        ))}
      </Box>

      <Box sx={{ mt: 5, display: 'flex', justifyContent: 'center' }}>
        <ButtonLink
          variant="outlined"
          to="/browse"
          aria-label="Find more fridges"
          title="Find More Fridges"
          sx={{
            borderRadius: '999px',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'none',
            '&.MuiButton-outlined': {
              border: `2px solid ${designColor.borderGray}`,
              color: designColor.secondaryText,
              py: 0.5,
              height: 38,
              px: 6,
            },
            '&.MuiButton-outlined:hover': {
              backgroundColor: designColor.blue.dark,
              color: designColor.white,
              border: `2px solid ${designColor.blue.dark}`,
            },
          }}
        />
      </Box>
    </Box>
  );
}
