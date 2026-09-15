'use client';

import React, { useState, useCallback } from 'react';
import {
  SwipeableDrawer,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
} from '@mui/material';
import {
  MapLegendConditionDirtyIcon,
  MapLegendConditionOutOfOrderIcon,
  MapLegendPinGhostIcon,
  MapLegendPinLocationIcon,
  MapLegendPinNotAtLocationIcon,
  MapLegendPinNoReportIcon,
} from 'theme/icons';
import { applyAlpha, designColor, pinColor } from 'theme/palette';

const iconSize = { width: '48px', height: '48px' };

const legendItems = [
  {
    icon: (
      <MapLegendPinLocationIcon
        sx={{ ...iconSize, color: pinColor.itemsFull }}
      />
    ),
    title: 'Full',
  },
  {
    icon: (
      <MapLegendPinLocationIcon
        sx={{ ...iconSize, color: pinColor.itemsMany }}
      />
    ),
    title: 'Many Items',
  },
  {
    icon: (
      <MapLegendPinLocationIcon
        sx={{ ...iconSize, color: pinColor.itemsFew }}
      />
    ),
    title: 'Few Items',
  },
  {
    icon: (
      <MapLegendPinLocationIcon
        sx={{ ...iconSize, color: pinColor.itemsEmpty }}
      />
    ),
    title: 'Empty',
  },
  {
    icon: (
      <MapLegendPinNoReportIcon
        sx={{ ...iconSize, color: pinColor.reportUnavailable }}
      />
    ),
    title: 'No status',
  },
  {
    icon: (
      <MapLegendPinNotAtLocationIcon
        sx={{ ...iconSize, color: pinColor.fridgeNotAtLocation }}
      />
    ),
    title: 'Not at location',
  },
  {
    icon: (
      <MapLegendConditionDirtyIcon
        sx={{ ...iconSize, color: pinColor.fridgeOperation }}
      />
    ),
    title: 'Needs cleaning',
  },
  {
    icon: (
      <MapLegendConditionOutOfOrderIcon
        sx={{ ...iconSize, color: pinColor.fridgeOperation }}
      />
    ),
    title: 'Needs repairs',
  },
  {
    icon: (
      <MapLegendPinGhostIcon
        sx={{ ...iconSize, color: pinColor.fridgeGhost }}
      />
    ),
    title: 'Ghost Fridge',
  },
];

const aboveFoldLegendItems = 6;
const drawerBleeding = 22.5;

function DrawerHandle(): React.ReactElement {
  return (
    <Box
      sx={{
        backgroundColor: applyAlpha('66', designColor.blue.dark),
        borderTopLeftRadius: 8,
        borderBottomLeftRadius: 8,
        pointerEvents: 'all',
        visibility: 'visible',
        position: 'absolute',
        height: 100,
        top: 'calc(50% - 50px)',
        width: drawerBleeding,
        left: -drawerBleeding,
      }}
    >
      <Box
        sx={{
          backgroundColor: designColor.blue.darkShade[0],
          position: 'absolute',
          width: 5,
          height: 50,
          top: 'calc(50% - 25px)',
          left: 5,
          borderRadius: 5,
        }}
      />
    </Box>
  );
}

export function LegendDrawer(): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [seeMore, setSeeMore] = useState(false);

  const handleToggle = useCallback(
    (newOpen: boolean) => () => {
      setOpen(newOpen);
    },
    []
  );

  return (
    <SwipeableDrawer
      anchor="right"
      open={open}
      onClick={handleToggle(!open)}
      onClose={handleToggle(false)}
      onOpen={handleToggle(true)}
      swipeAreaWidth={drawerBleeding}
      disableSwipeToOpen={false}
      ModalProps={{
        keepMounted: true,
      }}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 8,
          borderBottomLeftRadius: 8,
          overflow: 'visible',
          width: { xs: 140, sm: 160 },
          height: 'fit-content',
          top: `13vh`,
        },
      }}
      SwipeAreaProps={{
        sx: {
          height: 100,
          top: `40%`,
        },
      }}
      hideBackdrop
      disableScrollLock
    >
      <DrawerHandle />
      <List
        sx={{
          p: 1,
          backgroundColor: 'background.paper',
          borderTopLeftRadius: 8,
          borderBottomLeftRadius: 8,
        }}
      >
        <ListItem sx={{ p: 0 }}>
          <ListItemText
            primary="Map Key"
            primaryTypographyProps={{
              sx: {
                fontSize: { xs: '.85em', md: '.95em' },
                fontWeight: 'bold',
                ml: 3,
              },
            }}
          />
        </ListItem>
        {legendItems
          .slice(0, seeMore ? legendItems.length : aboveFoldLegendItems)
          .map((item) => (
            <ListItem key={item.title} sx={{ p: 0 }}>
              <ListItemIcon sx={{ minWidth: 30 }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.title}
                primaryTypographyProps={{
                  sx: { fontSize: { xs: '.85em', md: '.95em' } },
                }}
              />
            </ListItem>
          ))}
        <ListItem sx={{ p: 0 }}>
          <ListItemButton
            onClick={(e) => {
              setSeeMore(!seeMore);
              e.stopPropagation();
            }}
            sx={{ p: 0, textDecoration: 'underline !important' }}
          >
            <ListItemText
              primary={`See ${seeMore ? 'Less' : 'More'}`}
              primaryTypographyProps={{
                fontSize: { xs: '.85em', md: '.95em' },
                textTransform: 'none',
                color: 'text.secondary',
                fontWeight: '600',
                ml: 3,
              }}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </SwipeableDrawer>
  );
}

export default LegendDrawer;
