'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import Image from 'next/image';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import {
  MapLegendConditionDirtyIcon,
  MapLegendConditionOutOfOrderIcon,
  MapLegendPinGhostIcon,
  MapLegendPinLocationIcon,
  MapLegendPinNotAtLocationIcon,
} from 'theme/icons';
import { foodLevelConfig } from 'config/foodLevel';
import { getFirebaseFirestore } from 'config/firebase';
import { designColor, pinColor } from 'theme/palette';
import type { FlaggedFridgeReportStatus, FridgeReport } from 'types/domain';
import { ButtonLink, SuccessToast } from 'components/ui';
import { FridgeReportImage } from './FridgeReportImage';
import { GhostUpdatesNotice } from './GhostUpdatesNotice';

interface ActivityReport extends FridgeReport {
  userId?: string;
}

interface ReportHistoryPage {
  reports: ActivityReport[];
  nextToken: string | null;
}

function getFlaggedReportSnapshot(report: ActivityReport): FridgeReport {
  return {
    fridgeId: report.fridgeId,
    timestamp: report.timestamp,
    condition: report.condition,
    foodPercentage: report.foodPercentage,
    ...(typeof report.epochTimestamp === 'string'
      ? { epochTimestamp: report.epochTimestamp }
      : {}),
    ...(typeof report.photoUrl === 'string'
      ? { photoUrl: report.photoUrl }
      : {}),
    ...(typeof report.notes === 'string' ? { notes: report.notes } : {}),
  };
}

const usernameRequests = new Map<string, Promise<string | null>>();

function getUsername(userId: string): Promise<string | null> {
  const existingRequest = usernameRequests.get(userId);
  if (existingRequest) return existingRequest;

  const usersApiUrl = process.env.NEXT_PUBLIC_USERS_API_URL;
  if (!usersApiUrl) return Promise.resolve(null);

  const request = fetch(
    `${usersApiUrl}/v1/users/${encodeURIComponent(userId)}/username`,
    { headers: { Accept: 'application/json' } }
  )
    .then(async (response) => {
      if (!response.ok) return null;

      const data: unknown = await response.json();
      const username =
        typeof data === 'string'
          ? data
          : typeof data === 'object' && data !== null && 'username' in data
            ? data.username
            : null;

      return typeof username === 'string' && username.trim()
        ? username.trim()
        : null;
    })
    .catch(() => null);

  usernameRequests.set(userId, request);
  void request.then((username) => {
    if (!username) usernameRequests.delete(userId);
  });
  return request;
}

async function fetchReportHistoryPage(
  fridgeId: string,
  nextToken: string | null,
  signal: AbortSignal
): Promise<ReportHistoryPage> {
  const query = nextToken ? `?nextToken=${encodeURIComponent(nextToken)}` : '';
  const response = await fetch(
    `/v1/fridges/${encodeURIComponent(fridgeId)}/reports/history${query}`,
    { headers: { Accept: 'application/json' }, cache: 'no-store', signal }
  );

  if (!response.ok) {
    throw new Error(`Unable to load activity (${response.status})`);
  }

  return (await response.json()) as ReportHistoryPage;
}

export function formatActivityTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;

  const elapsedSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const fourWeeksInSeconds = 4 * 7 * 24 * 60 * 60;

  if (elapsedSeconds >= 0 && elapsedSeconds <= fourWeeksInSeconds) {
    const intervals = [
      { unit: 'second', seconds: 1 },
      { unit: 'minute', seconds: 60 },
      { unit: 'hour', seconds: 60 * 60 },
      { unit: 'day', seconds: 24 * 60 * 60 },
      { unit: 'week', seconds: 7 * 24 * 60 * 60 },
    ];
    const interval = [...intervals]
      .reverse()
      .find(({ seconds }) => elapsedSeconds >= seconds);
    const amount = interval ? Math.floor(elapsedSeconds / interval.seconds) : 0;
    const unit = interval?.unit ?? 'second';

    return `${amount} ${unit}${amount === 1 ? '' : 's'} ago`;
  }

  return date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function conditionPresentation(condition: string): {
  label: string;
  color: string;
  icon: React.ReactElement;
} {
  switch (condition.toLowerCase()) {
    case 'good':
      return {
        label: 'good',
        color: designColor.conditionIcon,
        icon: <CheckCircleOutlineIcon fontSize="small" />,
      };
    case 'dirty':
      return {
        label: 'needs cleaning',
        color: designColor.conditionIcon,
        icon: <MapLegendConditionDirtyIcon sx={{ width: 18, height: 18 }} />,
      };
    case 'out of order':
      return {
        label: 'needs repairs',
        color: designColor.conditionIcon,
        icon: (
          <MapLegendConditionOutOfOrderIcon sx={{ width: 18, height: 18 }} />
        ),
      };
    case 'ghost':
      return {
        label: condition,
        color: pinColor.fridgeGhost,
        icon: <MapLegendPinGhostIcon sx={{ width: 20, height: 20 }} />,
      };
    case 'not at location':
      return {
        label: condition,
        color: pinColor.fridgeNotAtLocation,
        icon: <MapLegendPinNotAtLocationIcon sx={{ width: 20, height: 20 }} />,
      };
    default:
      return {
        label: condition,
        color: designColor.mutedText,
        icon: <CheckCircleIcon fontSize="small" />,
      };
  }
}

function ActivityItem({
  report,
}: {
  report: ActivityReport;
}): React.ReactElement {
  const [username, setUsername] = useState('Anonymous');
  const [flagMenuAnchor, setFlagMenuAnchor] = useState<HTMLElement | null>(
    null
  );
  const [flagStatus, setFlagStatus] = useState<
    'idle' | 'submitting' | 'submitted' | 'error'
  >('idle');
  const flagMenuId = useId();
  const [flagToastOpen, setFlagToastOpen] = useState(false);
  const flagButtonLabel =
    flagStatus === 'submitting' ? 'Reporting...' : 'Report';
  const isAnonymous = username === 'Anonymous';
  const condition = conditionPresentation(report.condition);
  const foodLevel = foodLevelConfig[report.foodPercentage];
  const foodLabel = foodLevel?.label ?? 'Unknown';
  const foodColor = foodLevel?.color ?? pinColor.itemsEmpty;

  async function flagReport(reason: 'harmful' | 'inaccurate') {
    if (flagStatus === 'submitting') return;
    setFlagMenuAnchor(null);
    setFlagStatus('submitting');
    setFlagToastOpen(false);

    try {
      await addDoc(collection(getFirebaseFirestore(), 'FlaggedFridgeReports'), {
        fridgeId: report.fridgeId,
        reportTimestamp: report.timestamp,
        reason,
        status: 'none' satisfies FlaggedFridgeReportStatus,
        report: getFlaggedReportSnapshot(report),
        createdAt: serverTimestamp(),
      });
      setFlagStatus('submitted');
      setFlagToastOpen(true);
    } catch (error) {
      console.error('Unable to flag fridge report:', error);
      setFlagStatus('error');
      setFlagToastOpen(true);
    }
  }

  useEffect(() => {
    let isMounted = true;
    if (report.userId) {
      void getUsername(report.userId).then((resolvedUsername) => {
        if (isMounted && resolvedUsername) setUsername(resolvedUsername);
      });
    }

    return () => {
      isMounted = false;
    };
  }, [report.userId]);

  return (
    <Box
      component="article"
      sx={{
        py: 3,
        borderBottom: '1px solid',
        borderColor: designColor.lightSilver,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
        <Box
          aria-hidden="true"
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
            boxSizing: 'border-box',
            overflow: 'hidden',
            border: isAnonymous ? '1px solid' : undefined,
            borderColor: designColor.borderGray,
            bgcolor: isAnonymous ? designColor.white : designColor.blue.light,
            color: isAnonymous
              ? designColor.lightSilver
              : designColor.blue.dark,
            fontWeight: 700,
          }}
        >
          {isAnonymous ? (
            <AccountCircleIcon
              sx={{ width: '100%', height: '100%', transform: 'scale(1.2)' }}
            />
          ) : (
            username.charAt(0).toLocaleUpperCase()
          )}
        </Box>
        <Box minWidth={0} flex={1}>
          <Typography sx={{ fontWeight: 700, color: designColor.neroGray }}>
            {username}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatActivityTimestamp(report.timestamp)}
          </Typography>
        </Box>
        <Button
          size="small"
          endIcon={<FlagOutlinedIcon />}
          aria-label={flagButtonLabel}
          aria-haspopup="menu"
          aria-controls={flagMenuAnchor ? flagMenuId : undefined}
          aria-expanded={Boolean(flagMenuAnchor)}
          disabled={flagStatus === 'submitting'}
          onClick={(event) =>
            setFlagMenuAnchor(
              flagMenuAnchor
                ? null
                : (event.currentTarget.querySelector<HTMLElement>(
                    '.MuiButton-endIcon'
                  ) ?? event.currentTarget)
            )
          }
          sx={{
            alignSelf: 'flex-start',
            position: 'relative',
            top: '-8px',
            flexShrink: 0,
            color: designColor.secondaryText,
            minWidth: { xs: 44, sm: 64 },
            height: 44,
            '& .MuiButton-endIcon': {
              marginLeft: { xs: 0, sm: 1 },
              marginRight: { xs: 0, sm: '-2px' },
            },
          }}
        >
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            {flagButtonLabel}
          </Box>
        </Button>
        <Menu
          id={flagMenuId}
          anchorEl={flagMenuAnchor}
          open={Boolean(flagMenuAnchor)}
          onClose={() => setFlagMenuAnchor(null)}
          disableScrollLock
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{
            paper: {
              sx: {
                mt: 4,
                borderRadius: 2,
                borderTopRightRadius: 0,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.18)',
                overflow: 'visible',
              },
            },
          }}
        >
          <MenuItem onClick={() => void flagReport('inaccurate')}>
            <ErrorOutlineIcon
              aria-hidden="true"
              sx={{ mr: 1.5, color: designColor.secondaryText, fontSize: 17 }}
            />
            Inaccurate
          </MenuItem>
          <MenuItem onClick={() => void flagReport('harmful')}>
            <ReportProblemOutlinedIcon
              aria-hidden="true"
              sx={{ mr: 1.5, color: designColor.secondaryText, fontSize: 17 }}
            />
            Harmful
          </MenuItem>
          <svg
            aria-hidden="true"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            style={{
              position: 'absolute',
              top: -12,
              right: 0,
              overflow: 'visible',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            <defs>
              <clipPath
                id={`${flagMenuId}-pointer-shadow-clip`}
                clipPathUnits="userSpaceOnUse"
              >
                <rect x="-12" y="-12" width="36" height="24" />
              </clipPath>
              <filter
                id={`${flagMenuId}-pointer-shadow`}
                x="-100%"
                y="-100%"
                width="300%"
                height="300%"
              >
                <feDropShadow
                  dx="0"
                  dy="-2"
                  stdDeviation="3"
                  floodColor="#000000"
                  floodOpacity="0.18"
                />
              </filter>
            </defs>
            <g clipPath={`url(#${flagMenuId}-pointer-shadow-clip)`}>
              <path
                d="M0 12 L6.88 5.12 A3 3 0 0 1 12 7.24 L12 12 Z"
                fill="white"
                filter={`url(#${flagMenuId}-pointer-shadow)`}
              />
            </g>
          </svg>
        </Menu>
      </Stack>

      <SuccessToast
        open={flagToastOpen}
        onClose={() => setFlagToastOpen(false)}
        severity={flagStatus === 'error' ? 'error' : 'success'}
        duration={flagStatus === 'error' ? 6000 : 3000}
        message={
          flagStatus === 'error'
            ? 'Unable to submit your report. Please try again.'
            : 'Report submitted. Thank you for letting us know.'
        }
      />

      {report.notes && (
        <Typography
          sx={{ color: designColor.neroGray, mb: 2, whiteSpace: 'pre-wrap' }}
        >
          {report.notes}
        </Typography>
      )}

      {report.photoUrl && (
        <FridgeReportImage
          src={report.photoUrl}
          alt="Photo of the fridge status update"
          expandedAlt="Expanded photo of the fridge status update"
          borderRadius="12px"
          marginBottom={2}
        />
      )}

      <Stack direction="row" gap={1} flexWrap="wrap">
        <Chip
          size="small"
          icon={condition.icon}
          label={condition.label}
          sx={{
            height: 32,
            bgcolor: 'action.hover',
            color: designColor.neroGray,
            px: 1,
            '& .MuiChip-label': {
              px: 1.25,
              fontWeight: 500,
              fontSize: '0.875rem',
            },
            '& .MuiChip-icon': {
              color: condition.color,
              width: 20,
              height: 20,
              ml: 1,
              mr: -0.25,
            },
          }}
        />
        <Chip
          size="small"
          icon={<MapLegendPinLocationIcon sx={{ width: 20, height: 20 }} />}
          label={foodLabel.toLowerCase()}
          sx={{
            height: 32,
            bgcolor: 'action.hover',
            color: designColor.neroGray,
            px: 1,
            '& .MuiChip-label': {
              px: 1.25,
              fontWeight: 500,
              fontSize: '0.875rem',
            },
            '& .MuiChip-icon': {
              color: foodColor,
              width: 20,
              height: 20,
              ml: 1,
              mr: -0.25,
            },
          }}
        />
      </Stack>
    </Box>
  );
}

export function FridgeActivity({
  fridgeId,
  fridgeName,
  isActive = true,
  canUpdate = true,
  isGhost = false,
}: {
  fridgeId: string;
  fridgeName: string;
  isActive?: boolean;
  canUpdate?: boolean;
  isGhost?: boolean;
}): React.ReactElement | null {
  const [reports, setReports] = useState<ActivityReport[]>([]);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [initialRetry, setInitialRetry] = useState(0);
  const cursorRef = useRef<string | null>(null);
  const loadingRef = useRef(false);
  const controllerRef = useRef<AbortController | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    controllerRef.current = controller;
    cursorRef.current = null;
    loadingRef.current = true;

    fetchReportHistoryPage(fridgeId, null, controller.signal)
      .then((page) => {
        setReports(page.reports);
        cursorRef.current = page.nextToken;
        setNextToken(page.nextToken);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          loadingRef.current = false;
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [fridgeId, initialRetry]);

  const loadNextPage = useCallback(async () => {
    const cursor = cursorRef.current;
    const controller = controllerRef.current;
    if (!cursor || !controller || loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);
    setError(false);

    try {
      const page = await fetchReportHistoryPage(
        fridgeId,
        cursor,
        controller.signal
      );
      if (controller.signal.aborted) return;
      setReports((current) => [...current, ...page.reports]);
      cursorRef.current = page.nextToken;
      setNextToken(page.nextToken);
    } catch {
      if (!controller.signal.aborted) setError(true);
    } finally {
      if (!controller.signal.aborted) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, [fridgeId]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (
      !sentinel ||
      !nextToken ||
      !isActive ||
      loading ||
      error ||
      typeof IntersectionObserver === 'undefined'
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadNextPage();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [error, isActive, loadNextPage, loading, nextToken]);

  if (!isActive && reports.length === 0) {
    return null;
  }

  if (loading && reports.length === 0) {
    return (
      <Box
        role="status"
        aria-label="Loading activity"
        sx={{ display: 'flex', justifyContent: 'center', py: 4 }}
      >
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (error && reports.length === 0) {
    return (
      <Alert
        severity="error"
        action={
          <Button
            color="inherit"
            size="small"
            onClick={() => {
              setError(false);
              setLoading(true);
              setInitialRetry((count) => count + 1);
            }}
          >
            Retry
          </Button>
        }
      >
        Activity could not be loaded.
      </Alert>
    );
  }

  return (
    <Box>
      {reports.map((report) => (
        <ActivityItem
          key={`${report.epochTimestamp ?? report.timestamp}-${report.fridgeId}`}
          report={report}
        />
      ))}

      {error && (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => void loadNextPage()}
            >
              Retry
            </Button>
          }
          sx={{ mt: 2 }}
        >
          More activity could not be loaded.
        </Alert>
      )}

      {nextToken && !error && (
        <Stack alignItems="center" spacing={1} py={2}>
          {loading && <CircularProgress size={24} />}
          <Button onClick={() => void loadNextPage()} disabled={loading}>
            {loading ? 'Loading' : 'Load more'}
          </Button>
        </Stack>
      )}
      {!nextToken && !loading && !error && (
        <Stack alignItems="center" spacing={2} pt={6} pb={{ xs: 2, md: 6 }}>
          <Image
            src="/card/paragraph/jumpingBlueberries.svg"
            alt="Picture of blueberries jumping and waving"
            width={120}
            height={92}
          />
          <Typography color={designColor.secondaryText} textAlign="center">
            {canUpdate
              ? 'No more past activity. Add a new update!'
              : 'No more past activity.'}
          </Typography>
          <Box sx={{ width: '100%', pt: 0.5 }}>
            {isGhost ? (
              <GhostUpdatesNotice />
            ) : canUpdate ? (
              <ButtonLink
                aria-label="Click to report the status of the fridge"
                variant="contained"
                to={`/fridge/${fridgeId}/report?from=${encodeURIComponent(`/fridge/${fridgeId}`)}&name=${encodeURIComponent(fridgeName)}`}
                title="Update Status"
                startIcon={
                  <EditIcon sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }} />
                }
                sx={{
                  width: { xs: '96%', md: 'calc(100% - 16px)' },
                  mx: 'auto',
                  borderRadius: '999px',
                  fontWeight: 700,
                  fontSize: { xs: '0.75rem', md: '1rem' },
                  lineHeight: { xs: '1rem', md: '1.25rem' },
                  textTransform: 'uppercase',
                  backgroundColor: designColor.blue.dark,
                  border: `2px solid ${designColor.blue.dark}`,
                  minHeight: { xs: 40, md: 44 },
                  '&:hover': {
                    opacity: 0.9,
                    backgroundColor: designColor.blue.dark,
                  },
                  display: 'flex',
                  gap: { xs: '6px', md: '8px' },
                  py: { xs: 1.25, md: 1.125 },
                  px: { xs: 0.75, md: 1.25 },
                }}
              />
            ) : null}
          </Box>
        </Stack>
      )}
      <Box ref={sentinelRef} aria-hidden="true" sx={{ height: 1 }} />
    </Box>
  );
}
