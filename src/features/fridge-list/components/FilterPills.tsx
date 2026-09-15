'use client';

import React from 'react';
import { Box, Chip } from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';
import {
  MapLegendPinLocationIcon,
  MapLegendConditionDirtyIcon,
  MapLegendConditionOutOfOrderIcon,
  MapLegendPinNotAtLocationIcon,
  MapLegendPinGhostIcon,
  MapLegendPinNoReportIcon,
} from 'theme/icons';
import { pinColor } from 'theme/palette';
import { FilterKey } from '../hooks/useFridgeSearch';
import { useAnalytics } from 'hooks/useAnalytics';

const FILTER_DEFS: Array<{
  key: FilterKey;
  label: string;
  makeIcon: () => React.ReactElement;
  iconColor: string;
}> = [
  {
    key: 'full',
    label: 'Full',
    makeIcon: () => <MapLegendPinLocationIcon />,
    iconColor: pinColor.itemsFull,
  },
  {
    key: 'many',
    label: 'Many Items',
    makeIcon: () => <MapLegendPinLocationIcon />,
    iconColor: pinColor.itemsMany,
  },
  {
    key: 'few',
    label: 'Few Items',
    makeIcon: () => <MapLegendPinLocationIcon />,
    iconColor: pinColor.itemsFew,
  },
  {
    key: 'empty',
    label: 'Empty',
    makeIcon: () => <MapLegendPinLocationIcon />,
    iconColor: pinColor.itemsEmpty,
  },
  {
    key: 'dirty',
    label: 'Needs Cleaning',
    makeIcon: () => <MapLegendConditionDirtyIcon />,
    iconColor: pinColor.fridgeOperation,
  },
  {
    key: 'out-of-order',
    label: 'Needs Repairs',
    makeIcon: () => <MapLegendConditionOutOfOrderIcon />,
    iconColor: pinColor.fridgeOperation,
  },
  {
    key: 'no-data',
    label: 'No Data Yet',
    makeIcon: () => <MapLegendPinNoReportIcon />,
    iconColor: pinColor.reportUnavailable,
  },
  {
    key: 'not-at-location',
    label: 'Not at Location',
    makeIcon: () => <MapLegendPinNotAtLocationIcon />,
    iconColor: pinColor.fridgeNotAtLocation,
  },
  {
    key: 'ghost',
    label: 'Ghost Fridge',
    makeIcon: () => <MapLegendPinGhostIcon />,
    iconColor: pinColor.fridgeGhost,
  },
];

interface FilterPillsProps {
  activeFilters: Set<FilterKey>;
  onToggle: (filter: FilterKey) => void;
  sx?: SxProps<Theme>;
}

export function FilterPills({
  activeFilters,
  onToggle,
  sx,
}: FilterPillsProps): React.ReactElement {
  const { trackEvent } = useAnalytics();
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        gap: 1,
        overflowX: 'auto',
        // Hide scrollbar cross-browser
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
        pb: 0.5,
        ...sx,
      }}
    >
      {FILTER_DEFS.map(({ key, label, makeIcon, iconColor }) => {
        const active = activeFilters.has(key);
        return (
          <Chip
            key={key}
            label={label}
            icon={makeIcon()}
            onClick={() => {
              trackEvent({
                action: 'fridge_filter_toggle',
                category: 'fridge_browse',
                label: key,
              });
              onToggle(key);
            }}
            variant="outlined"
            sx={{
              flexShrink: 0,
              backgroundColor: active ? '#C8C8C8' : 'white',
              borderColor: 'rgba(0,0,0,0.15)',
              fontWeight: 600,
              fontSize: '0.875rem',
              height: 40,
              cursor: 'pointer',
              '& .MuiChip-icon': {
                fontSize: 20,
                color: iconColor,
              },
              '&:hover, &.MuiChip-clickable:hover, &:focus-visible': {
                backgroundColor: active ? '#B8B8B8' : '#F0F0F0',
              },
            }}
          />
        );
      })}
    </Box>
  );
}
