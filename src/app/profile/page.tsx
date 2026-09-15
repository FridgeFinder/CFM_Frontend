'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import NextLink from 'next/link';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useRouter } from 'next/navigation';
import { useAuthStore } from 'store/useAuthStore';
import { useFollowingStore } from 'store/useFollowingStore';
import { designColor } from 'theme/palette';
import { CleanedIcon, FilledIcon, PointsIcon, ReportedIcon } from 'theme/icons';

const USER_STATS_BASE_URL = `${process.env.NEXT_PUBLIC_USER_REWARDS_API_URL}/v1/user-action-stats`;

interface UserActionStats {
  totalPoints: string;
  fridgeReportCount: string;
  cleanedCount: string;
  filledCount: string;
}

// In-memory cache — cleared on page reload, shared across re-renders
const statsCache = new Map<string, UserActionStats>();

// ─── Theme constants for the fridge card ─────────────────────────
const FRIDGE_COLORS = ['#c5d8ff', '#a8c3f8', '#88b3ff'] as const;
const LABEL_COLOR = '#1a3d7a';
const AVATAR_BG = '#4a7ab5';
const MAGNET_COLOR = '#d45d5d';

const GLASS_SURFACE = 'rgba(255,255,255,0.9)';
const GLASS_SURFACE_MUTED = 'rgba(255,255,255,0.6)'; //REMOVE when ACTIVITY and BAGES sections are implemented
const GLASS_BORDER = 'rgba(255,255,255,0.5)';

const PROFILE_TEXT_SECONDARY = '#555';
const SURFACE_SHADOW = '0 2px 6px rgba(0,0,0,0.1)';

const fridgeGradient = `linear-gradient(175deg, ${FRIDGE_COLORS[0]} 0%, ${FRIDGE_COLORS[1]} 50%, ${FRIDGE_COLORS[2]} 100%)`;
const pageGradient = `linear-gradient(170deg, ${FRIDGE_COLORS[0]}66 0%, ${FRIDGE_COLORS[1]}44 50%, ${FRIDGE_COLORS[2]}55 100%)`;
const handleGradient =
  'linear-gradient(180deg, #d4d4d4ee 0%, #d4d4d4 40%, #d4d4d4cc 100%)';
const handleShadow =
  '2px 3px 8px rgba(0,0,0,0.25), inset 0 1px 2px rgba(255,255,255,0.6), inset 0 -1px 1px rgba(0,0,0,0.1), -1px 0 2px rgba(0,0,0,0.1)';
const lightControlSx = {
  bgcolor: GLASS_SURFACE,
  border: `1px solid ${GLASS_BORDER}`,
  boxShadow: SURFACE_SHADOW,
  color: designColor.neroGray,
  '&:hover': { bgcolor: designColor.white },
} as const;

// ════════════════════════════════════════════════════════════════
export default function ProfilePage() {
  const router = useRouter();
  const authStatus = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const userProfile = useAuthStore((s) => s.userProfile);
  const followingCount = useFollowingStore((s) => s.notifications.length);
  const fetchFollowing = useFollowingStore((s) => s.fetch);
  const actionStats = useActionStats(user?.uid);

  const profileUsername = userProfile?.username ?? '...';
  const profileUserType = userProfile?.userType ?? '...';

  useEffect(() => {
    if (authStatus === 'unauthenticated' && !user) {
      router.replace('/auth/signin');
    }
  }, [authStatus, router, user]);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      fetchFollowing();
    }
  }, [authStatus, fetchFollowing, user?.uid]);

  useEffect(() => {
    if (authStatus === 'authenticated' && user && !userProfile) {
      void useAuthStore.getState().fetchUserProfile(user);
    }
  }, [authStatus, user, userProfile]);

  if (authStatus !== 'authenticated' || !user) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: pageGradient, //TODO: should be the default page gradient
        }}
      />
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: pageGradient,
        pt: { xs: 0, md: 6 },
        pb: { xs: 3, md: 5 },
      }}
    >
      <Box
        sx={{ width: '100%', maxWidth: 512, mx: 'auto', px: { xs: 0, md: 4 } }}
      >
        {/* ── THE FRIDGE ────────────────────────────────────────── */}
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: { xs: 0, md: 4 },
            border: { md: `1px solid ${designColor.lightSilver}` },
            boxShadow: { md: '0 10px 30px rgba(0,0,0,0.15)' },
            background: fridgeGradient,
          }}
        >
          {/* Subtle horizontal texture */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              opacity: 0.04,
              backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, ${GLASS_BORDER} 1px, ${GLASS_BORDER} 2px)`,
              pointerEvents: 'none',
            }}
          />
          <FridgeHandle top="12%" height={56} />
          <FridgeHandle top="55%" height={80} />
          {/* Inset border */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              boxShadow: 'inset 0 0 0 3px rgba(0,0,0,0.06)',
              pointerEvents: 'none',
            }}
          />

          {/* ── FREEZER SECTION ─────────────────────────────────── */}
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              pl: 5,
              pr: 7,
              pt: 5,
              pb: 4,
            }}
          >
            <IconButton
              component={NextLink}
              href="/settings"
              size="small"
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                ...lightControlSx,
              }}
            >
              <SettingsIcon sx={{ fontSize: 18 }} />
            </IconButton>

            {/* Identity row */}
            <Stack
              direction="row"
              spacing={3}
              alignItems="flex-start"
              sx={{ mb: 3, pr: { xs: 8, sm: 10 } }}
            >
              <PolaroidAvatar />
              <IdentityCard
                username={profileUsername}
                userType={profileUserType}
                followingCount={followingCount}
              />
            </Stack>

            {/* Stats 2x2 grid */}
            <StatsGrid actionStats={actionStats} />

            {/* TODO: uncomment the Edit Profile page is implemented */}
            {/* Action buttons */}
            {/* <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
              <Button
                component={NextLink}
                href="/profile/edit"
                startIcon={<EditOutlinedIcon sx={{ fontSize: 15 }} />}
                sx={{
                  ...lightControlSx,
                  borderRadius: 999,
                  px: 3,
                  height: 32,
                  minHeight: 32,
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  textTransform: 'none',
                }}
              >
                Edit Profile
              </Button>
            </Stack> */}
          </Box>

          {/* ── Divider (freezer / fridge) ──────────────────────── */}
          <Box sx={{ position: 'relative', zIndex: 1, mx: 2 }}>
            <Box
              sx={{
                height: 3,
                borderRadius: 999,
                background:
                  'linear-gradient(to right, rgba(0,0,0,0.06), rgba(0,0,0,0.12) 20%, rgba(0,0,0,0.12) 80%, rgba(0,0,0,0.06))',
              }}
            />
            <Box
              sx={{
                height: '1px',
                mt: '1px',
                borderRadius: 999,
                background: `linear-gradient(to right, transparent, ${GLASS_BORDER} 20%, ${GLASS_BORDER} 80%, transparent)`,
              }}
            />
          </Box>

          {/* ── FRIDGE SECTION ─────────────────────────────────── */}
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              pl: 5,
              pr: 7,
              pt: 4,
              pb: 5,
            }}
          >
            {/* Activity */}
            <Box sx={{ mb: 2 }}>
              <SectionLabel>Activity</SectionLabel>
              <ComingSoonPlaceholder height={275} />
            </Box>

            {/* Badges */}
            <Box sx={{ mt: 5 }}>
              <SectionLabel>Badges</SectionLabel>
              <ComingSoonPlaceholder height={96} />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// ─── Sub-components ─────────────────────────────────────────────

function StatsGrid({ actionStats }: { actionStats: UserActionStats | null }) {
  const stats = [
    {
      key: 'points',
      value: actionStats ? Number(actionStats.totalPoints) : '0',
      label: 'Points',
      Icon: PointsIcon,
    },
    {
      key: 'reported',
      value: actionStats ? Number(actionStats.fridgeReportCount) : '0',
      label: 'Reported',
      Icon: ReportedIcon,
    },
    {
      key: 'cleaned',
      value: actionStats ? Number(actionStats.cleanedCount) : '0',
      label: 'Cleaned',
      Icon: CleanedIcon,
    },
    {
      key: 'filled',
      value: actionStats ? Number(actionStats.filledCount) : '0',
      label: 'Filled',
      Icon: FilledIcon,
    },
  ];

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 2,
        mt: 4,
        maxWidth: 340,
      }}
    >
      {stats.map(({ key, value, label, Icon }) => (
        <Stack
          key={key}
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{
            bgcolor: GLASS_SURFACE,
            borderRadius: 999,
            px: 3,
            height: 38,
            border: `1px solid ${GLASS_BORDER}`,
            boxShadow: SURFACE_SHADOW,
          }}
        >
          <Icon size={22} />
          <Typography
            variant="inherit"
            sx={{
              fontSize: '0.9rem',
              fontWeight: 550,
              color: designColor.neroGray,
              px: 0.5,
              letterSpacing: '0.05em',
            }}
          >
            {value}
          </Typography>
          <Typography
            variant="inherit"
            sx={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: designColor.mutedText,
              letterSpacing: '0.04em',
            }}
          >
            {label}
          </Typography>
        </Stack>
      ))}
    </Box>
  );
}

function IdentityCard({
  username,
  userType,
  followingCount,
}: {
  username: string;
  userType: string;
  followingCount: number;
}) {
  return (
    <Box
      sx={{
        bgcolor: GLASS_SURFACE,
        borderRadius: 4,
        px: 4,
        py: 3,
        border: `1px solid ${GLASS_SURFACE_MUTED}`,
        boxShadow: SURFACE_SHADOW,
        display: 'inline-flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      <Typography
        variant="inherit"
        sx={{
          fontSize: { xs: '1.1rem', sm: '1.35rem' },
          fontWeight: 500,
          lineHeight: 1.15,
          maxWidth: { xs: 180, sm: 220, md: 240 },
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {username}
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography
          variant="inherit"
          sx={{
            fontSize: '0.8rem',
            fontWeight: 600,
            color: PROFILE_TEXT_SECONDARY,
          }}
        >
          {userType}
        </Typography>
        <Typography
          variant="inherit"
          sx={{
            color: designColor.lightSilver,
            fontSize: '0.8rem',
            fontWeight: 800,
          }}
        >
          ·
        </Typography>
        <Box
          component={NextLink}
          href="/my-fridges"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.25,
            textDecoration: 'none',
            color: PROFILE_TEXT_SECONDARY,
            '&:hover': { color: designColor.blue.dark },
          }}
        >
          <Typography
            variant="inherit"
            sx={{ fontSize: '0.8rem', fontWeight: 500, color: 'inherit' }}
          >
            <Box component="span" sx={{ fontWeight: 700 }}>
              {followingCount}
            </Box>{' '}
            Following
          </Typography>
          <ChevronRightIcon
            sx={{ fontSize: '0.8rem', color: designColor.mutedText }}
          />
        </Box>
      </Stack>
    </Box>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1.5 }}>
      <Typography
        variant="inherit"
        sx={{
          fontSize: '0.875rem',
          fontWeight: 500,
          color: LABEL_COLOR,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}
      >
        {children}
      </Typography>
      <ChevronRightIcon
        sx={{ fontSize: 18, color: LABEL_COLOR, opacity: 0.6 }}
      />
    </Stack>
  );
}

function ComingSoonPlaceholder({ height }: { height: number }) {
  return (
    <Box
      sx={{
        height,
        width: '100%',
        bgcolor: GLASS_SURFACE_MUTED,
        borderRadius: 3,
        border: `1px solid ${GLASS_BORDER}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography
        variant="inherit"
        sx={{
          fontSize: '0.6875rem',
          fontWeight: 500,
          color: designColor.mutedText,
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
        }}
      >
        Coming Soon
      </Typography>
    </Box>
  );
}

function FridgeHandle({ top, height }: { top: string; height: number }) {
  return (
    <Box
      sx={{
        position: 'absolute',
        top,
        right: 10,
        width: 8,
        height,
        borderRadius: 1,
        background: handleGradient,
        boxShadow: handleShadow,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: '4px 1px',
          borderRadius: '3px',
          background:
            'linear-gradient(to right, transparent, rgba(255,255,255,0.4) 30%, rgba(255,255,255,0.1) 70%, transparent)',
        }}
      />
    </Box>
  );
}

function PolaroidAvatar() {
  return (
    <Box
      sx={{ position: 'relative', flexShrink: 0, transform: 'rotate(-4deg)' }}
    >
      <Box
        sx={{
          bgcolor: designColor.white,
          p: '6px',
          pb: '20px',
          border: `1px solid ${designColor.lightSilver}`,
          boxShadow: SURFACE_SHADOW,
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            bgcolor: AVATAR_BG,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: '5px',
          }}
        >
          <Image
            src="/card/paragraph/peach.svg"
            alt="Profile"
            width={50}
            height={50}
            style={{ objectFit: 'contain', width: '90%', height: '90%' }}
          />
        </Box>
      </Box>
      <Box
        sx={{
          position: 'absolute',
          top: -6,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: `radial-gradient(circle at 35% 35%, ${MAGNET_COLOR}ee, ${MAGNET_COLOR})`,
          boxShadow:
            '0 1px 2px rgba(0,0,0,0.25), inset 0 1px 1px rgba(255,255,255,0.3)',
          zIndex: 1,
        }}
      />
    </Box>
  );
}

// ─── Illustration placeholders ───────────────────────────────────

function useActionStats(uid: string | undefined): UserActionStats | null {
  const [fetchedStatsByUid, setFetchedStatsByUid] = useState<
    Record<string, UserActionStats>
  >({});
  const cachedStats = uid ? (statsCache.get(uid) ?? null) : null;
  const actionStats = uid ? (fetchedStatsByUid[uid] ?? cachedStats) : null;

  useEffect(() => {
    if (!uid) return;

    // Always revalidate in background
    fetch(`${USER_STATS_BASE_URL}/${uid}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: UserActionStats | null) => {
        if (!data) return;
        // Only update state if something actually changed
        const current = statsCache.get(uid);
        if (JSON.stringify(current) !== JSON.stringify(data)) {
          statsCache.set(uid, data);
        }

        setFetchedStatsByUid((prev) => {
          const previousStats = prev[uid];
          if (JSON.stringify(previousStats) === JSON.stringify(data)) {
            return prev;
          }

          return {
            ...prev,
            [uid]: data,
          };
        });
      })
      .catch(() => {});
  }, [uid]);

  return actionStats;
}
