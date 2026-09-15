import React from 'react';
import {
  IconButton,
  List,
  ListItem,
  Stack,
  Tooltip,
  Typography,
  Chip,
  Box,
} from '@mui/material';
import {
  CalendarMonthOutlined as CalendarIcon,
  Instagram as InstagramIcon,
  LocationOnOutlined as LocationOnOutlinedIcon,
  ArrowForward as ArrowForwardIcon,
  NotificationsOutlined as NotificationsOutlinedIcon,
} from '@mui/icons-material';
import {
  MapLegendPinLocationIcon,
  MapLegendConditionDirtyIcon,
  MapLegendConditionOutOfOrderIcon,
  MapLegendPinNotAtLocationIcon,
  MapLegendPinGhostIcon,
  MapLegendPinNoReportIcon,
} from 'theme/icons';
import { pinColor, designColor } from 'theme/palette';
import { foodLevelConfig } from 'config/foodLevel';
import { ButtonLink, NextLink } from 'components/ui';
import { useAnalytics } from 'hooks/useAnalytics';
import { Fridge, Location as LocationType } from 'types/domain';

function formatDate(isoString: string): string {
  const msSinceEpoch = Date.parse(isoString);
  return new Date(msSinceEpoch).toLocaleDateString([], {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface LocationInfoProps {
  location: LocationType;
}

function LocationInfo({ location }: LocationInfoProps): React.ReactElement {
  const addressString = `${location.street}, ${location.city}, ${location.state} ${location.zip}`;

  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <LocationOnOutlinedIcon
        sx={{ color: 'text.secondary', fontSize: '1.5rem' }}
      />
      <Typography sx={{ fontSize: '1rem', color: 'text.primary' }}>
        {addressString}
      </Typography>
    </Stack>
  );
}

interface InstagramInfoProps {
  instagramUrl: string;
}

function InstagramInfo({
  instagramUrl,
}: InstagramInfoProps): React.ReactElement {
  const instagramRegex =
    /(?:(?:http|https):\/\/)?(?:www.)?(?:instagram.com|instagr.am|instagr.com)\/([\w.]+)/gim;
  const match = instagramRegex.exec(instagramUrl);
  const handle = match ? match[1] : instagramUrl;

  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <InstagramIcon sx={{ color: 'text.secondary', fontSize: '1.5rem' }} />
      <Typography
        component="a"
        href={`https://instagram.com/${handle}`}
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          fontSize: ['1rem'],
          color: 'text.primary',
          textDecoration: 'none',
          '&:hover': {
            color: 'primary.main',
            textDecoration: 'underline',
          },
        }}
      >
        @{handle}
      </Typography>
    </Stack>
  );
}

interface LastUpdateInfoProps {
  date: string;
}

function LastUpdateInfo({ date }: LastUpdateInfoProps): React.ReactElement {
  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <CalendarIcon sx={{ color: 'text.secondary', fontSize: '1.5rem' }} />
      <Typography sx={{ fontSize: '1rem', color: 'text.primary' }}>
        Last Update: {formatDate(date)}
      </Typography>
    </Stack>
  );
}

function StatusRow({
  icon: Icon,
  color,
  label,
}: {
  icon: React.ElementType;
  color: string;
  label: string;
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Icon sx={{ width: 28, height: 28, color }} />
      <Typography
        sx={{ fontSize: '1rem', fontWeight: 600, color: 'text.secondary' }}
      >
        {label}
      </Typography>
    </Box>
  );
}

function FridgeStatus({
  report,
}: {
  report: Fridge['report'];
}): React.ReactElement | null {
  if (!report) {
    return (
      <StatusRow
        icon={MapLegendPinNoReportIcon}
        color={pinColor.reportUnavailable}
        label="No status"
      />
    );
  }

  const { condition, foodPercentage } = report;

  if (condition === 'not at location') {
    return (
      <StatusRow
        icon={MapLegendPinNotAtLocationIcon}
        color={pinColor.fridgeNotAtLocation}
        label="Not at location"
      />
    );
  }

  if (condition === 'ghost') {
    return (
      <StatusRow
        icon={MapLegendPinGhostIcon}
        color={pinColor.fridgeGhost}
        label="Ghost Fridge"
      />
    );
  }

  const foodEntry = foodLevelConfig[foodPercentage];
  const foodText = foodEntry?.label ?? 'Unknown';
  const foodColor = foodEntry?.color ?? pinColor.itemsEmpty;

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 3,
        alignItems: 'center',
      }}
    >
      <StatusRow
        icon={MapLegendPinLocationIcon}
        color={foodColor}
        label={foodText}
      />

      {condition === 'dirty' && (
        <StatusRow
          icon={MapLegendConditionDirtyIcon}
          color={pinColor.fridgeOperation}
          label="Needs cleaning"
        />
      )}
      {condition === 'out of order' && (
        <StatusRow
          icon={MapLegendConditionOutOfOrderIcon}
          color={pinColor.fridgeOperation}
          label="Needs repairs"
        />
      )}
    </Box>
  );
}

interface FridgeListProps {
  fridges: Fridge[];
  onFridgeSelect?: (id: string) => void;
}

export const FridgeList = React.memo(function FridgeList({
  fridges,
  onFridgeSelect,
}: FridgeListProps): React.ReactElement {
  const { trackEvent } = useAnalytics();
  return (
    <List disablePadding>
      {fridges.map((fridge, fridgeIndex) => (
        <ListItem
          key={fridge.id}
          divider={fridgeIndex !== fridges.length - 1}
          sx={{
            paddingY: 4,
            paddingX: { xs: 2, md: 0 },
            borderColor: 'rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
          }}
        >
          <Stack direction="column" spacing={2} width="100%">
            <Box
              onClick={() => onFridgeSelect?.(fridge.id)}
              role="button"
              tabIndex={0}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                transition: 'color 0.2s ease',
                '&:hover': {
                  color: 'primary.main',
                  '& .action-icon': {
                    color: 'primary.main',
                    transform: 'translateX(4px)',
                  },
                },
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onFridgeSelect?.(fridge.id);
                }
              }}
            >
              <Typography
                sx={{
                  fontSize: { xs: '1.25rem', md: '1.125rem' },
                  fontWeight: 800,
                  color: 'inherit',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                }}
              >
                {fridge.name}
              </Typography>
              <ArrowForwardIcon
                className="action-icon"
                sx={{
                  fontSize: '1.4rem',
                  color: 'text.secondary',
                  transition: 'all 0.2s ease',
                }}
              />
            </Box>

            <Box sx={{ mt: 0.5 }}>
              <FridgeStatus report={fridge.report} />
            </Box>

            <Box sx={{ mt: 1 }}>
              {fridge.report ? (
                <LastUpdateInfo date={fridge.report.timestamp} />
              ) : null}
              <Box sx={{ mt: 1 }}>
                <LocationInfo location={fridge.location} />
              </Box>
            </Box>

            <Stack
              direction="row"
              width="100%"
              justifyContent="flex-start"
              alignItems="center"
              spacing={2}
              sx={{ mt: 2 }}
            >
              <ButtonLink
                variant="contained"
                to={`/fridge/${fridge.id}`}
                aria-label={`Details on ${fridge.name}`}
                sx={{ fontSize: '0.85rem', py: 1.5, px: 4 }}
                title="View Profile"
                onClick={() =>
                  trackEvent({
                    action: 'fridge_profile_view',
                    category: 'fridge_browse',
                    label: 'list',
                  })
                }
              />
              <ButtonLink
                variant="contained"
                to={`/fridge/${fridge.id}/report?from=${encodeURIComponent('/browse')}&name=${encodeURIComponent(fridge.name)}`}
                aria-label={`Update Status on ${fridge.name}`}
                sx={{ fontSize: '0.85rem', py: 1.5, px: 4 }}
                title="Update status"
              />
              <Tooltip title="Notifications">
                <IconButton
                  aria-label={`Notifications for ${fridge.name}`}
                  component={NextLink}
                  href={`/fridge/${fridge.id}/notifications?name=${encodeURIComponent(fridge.name)}&from=browse`}
                  onClick={() =>
                    trackEvent({
                      action: 'fridge_bell_click',
                      category: 'fridge_browse',
                      label: fridge.id,
                    })
                  }
                  sx={{
                    borderRadius: '50%',
                    backgroundColor: designColor.whiteSmoke,
                    color: designColor.secondaryText, //could be #555
                    border: `1px solid ${designColor.borderGray}`,
                    flexShrink: 0,
                    width: 44,
                    height: 44,
                    transition: 'background-color 0.2s ease, color 0.2s ease',
                    '&:hover': {
                      backgroundColor: designColor.borderGray,
                      color: designColor.neroGray,
                    },
                  }}
                >
                  <NotificationsOutlinedIcon sx={{ fontSize: '1.35rem' }} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </ListItem>
      ))}

      {/* Hidden empty items to allow scrolling beyond the last fridge item */}
      <ListItem aria-hidden="true" sx={{ height: 40, border: 'none' }} />
      <ListItem aria-hidden="true" sx={{ height: 40, border: 'none' }} />
      <ListItem aria-hidden="true" sx={{ height: 40, border: 'none' }} />
    </List>
  );
});
