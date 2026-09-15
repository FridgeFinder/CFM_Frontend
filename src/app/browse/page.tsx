'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import dynamic from 'next/dynamic';
import {
  Box,
  Typography,
  Divider,
  Fab,
  Badge,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  Tune as TuneIcon,
  MyLocation as MyLocationIcon,
} from '@mui/icons-material';

import {
  FridgeList,
  FilterPills,
  SearchMap,
  useFridgeSearch,
} from 'features/fridge-list';
import {
  MapLegendPinLocationIcon,
  MapLegendConditionDirtyIcon,
  MapLegendConditionOutOfOrderIcon,
  MapLegendPinNotAtLocationIcon,
  MapLegendPinGhostIcon,
  MapLegendPinNoReportIcon,
} from 'theme/icons';
import { pinColor, designColor } from 'theme/palette';
import { Fridge } from 'types/domain';
import {
  MapToggle,
  MapView,
} from 'features/fridge-map/components/MapToggle/MapToggle';
import { useFridgeStore } from 'store/useFridgeStore';
import { useMapStore } from 'store/useMapStore';
import { useAnalytics } from 'hooks/useAnalytics';
import { StateBoundary } from 'components/shared/StateBoundary';
import { FridgeListSkeleton } from 'components/shared/skeletons/FridgeSkeletons';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ClickAwayListener,
} from '@mui/material';

const DynamicMap = dynamic(
  () => import('features/fridge-map').then((mod) => mod.MapContainer),
  { ssr: false, loading: () => <FridgeListSkeleton /> }
);

function FridgeMobileStatus({
  report,
}: {
  report: Fridge['report'];
}): React.ReactElement | null {
  if (!report) {
    return (
      <MapLegendPinNoReportIcon
        sx={{ width: 24, height: 24, color: pinColor.reportUnavailable }}
      />
    );
  }

  const { condition, foodPercentage } = report;

  if (condition === 'not at location') {
    return (
      <MapLegendPinNotAtLocationIcon
        sx={{ width: 24, height: 24, color: pinColor.fridgeNotAtLocation }}
      />
    );
  }

  if (condition === 'ghost') {
    return (
      <MapLegendPinGhostIcon
        sx={{ width: 24, height: 24, color: pinColor.fridgeGhost }}
      />
    );
  }

  const foodColors = [
    pinColor.itemsEmpty,
    pinColor.itemsFew,
    pinColor.itemsMany,
    pinColor.itemsFull,
  ];

  const foodColor = foodColors[foodPercentage] || foodColors[0];

  return (
    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
      <MapLegendPinLocationIcon
        sx={{ width: 24, height: 24, color: foodColor }}
      />
      {condition === 'dirty' && (
        <MapLegendConditionDirtyIcon
          sx={{ width: 24, height: 24, color: pinColor.fridgeOperation }}
        />
      )}
      {condition === 'out of order' && (
        <MapLegendConditionOutOfOrderIcon
          sx={{ width: 24, height: 24, color: pinColor.fridgeOperation }}
        />
      )}
    </Box>
  );
}

// Force DynamicMap to wrap in React.memo so it DOES NOT re-render
// every single time the user typing in the search box changes BrowsePage state.
const MemoizedMap = React.memo(DynamicMap);

export default function BrowsePage(): React.ReactElement {
  const { fridges, status, error, fetchFridges } = useFridgeStore();
  const setSelectedFridgeId = useMapStore((state) => state.setSelectedFridgeId);
  const userLocation = useMapStore((state) => state.userLocation);
  const { trackEvent } = useAnalytics();
  const [currentView, setCurrentView] = useState<MapView>('map');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const mapRef = useRef<LeafletMap | null>(null);
  const hasTrackedSearch = useRef(false);

  const handleLocate = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const map = mapRef.current;
      if (!map) return;
      if (userLocation) {
        map.flyTo(userLocation, 15, { animate: true, duration: 1.0 });
        return;
      }
      map.locate({
        watch: true,
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 15000,
        setView: true,
        maxZoom: 15,
      });
    },
    [userLocation]
  );

  const {
    searchQuery,
    setSearchQuery,
    filteredFridges,
    mapFridges,
    isSearching,
    activeFilters,
    toggleFilter,
  } = useFridgeSearch(fridges);

  // Snapshot of mapFridges that only updates when the map is visible.
  const [mapFridgesSnapshot, setMapFridgesSnapshot] =
    useState<Fridge[]>(mapFridges);
  useEffect(() => {
    if (currentView === 'map') {
      setMapFridgesSnapshot(mapFridges);
    }
  }, [mapFridges, currentView]);

  useEffect(() => {
    fetchFridges();
  }, [fetchFridges]);

  useEffect(() => {
    if (searchQuery.length === 1 && !hasTrackedSearch.current) {
      hasTrackedSearch.current = true;
      trackEvent({
        action: 'search_start',
        category: 'fridge_browse',
        label: 'search_bar',
      });
    }
    if (searchQuery.length === 0) {
      hasTrackedSearch.current = false;
    }
  }, [searchQuery, trackEvent]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        position: 'fixed',
        inset: 0,
        paddingTop: { xs: '56px', sm: '64px' }, // MUI Toolbar is 56px on mobile, 64px on desktop
        backgroundColor: 'background.paper',
      }}
    >
      {/* Mobile Floating Search Bar (Map View Only) */}
      {currentView === 'map' && (
        <ClickAwayListener onClickAway={() => setIsDropdownOpen(false)}>
          <Box
            sx={{
              display: { xs: 'block', md: 'none' },
              position: 'absolute',
              top: { xs: 72, sm: 80 }, // AppBar (56/64px) + 16px gap
              left: 16,
              right: 16,
              zIndex: 1000,
            }}
          >
            <SearchMap
              searchQuery={searchQuery}
              onSearchChange={(val) => {
                setSearchQuery(val);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              hideCloseIcon
            />
            {showFilters && (
              <FilterPills
                activeFilters={activeFilters}
                onToggle={toggleFilter}
                sx={{ mt: 1 }}
              />
            )}
            {searchQuery.length > 0 && isDropdownOpen && (
              <Box
                sx={{
                  mt: 1,
                  maxHeight: '50vh',
                  overflowY: 'auto',
                  backgroundColor: 'rgba(255, 255, 255, 0.98)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: 4,
                  border: '1px solid rgba(0,0,0,0.08)',
                  boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {isSearching ? (
                  <FridgeListSkeleton />
                ) : filteredFridges.length > 0 ? (
                  <List disablePadding>
                    {filteredFridges.map((fridge, i) => (
                      <ListItem disablePadding key={fridge.id}>
                        <ListItemButton
                          divider={i !== filteredFridges.length - 1}
                          onClick={() => {
                            trackEvent({
                              action: 'search_result_select',
                              category: 'fridge_browse',
                              label: fridge.id,
                            });
                            setSelectedFridgeId(fridge.id);
                            setIsDropdownOpen(false); // Just hide dropdown, keep query
                          }}
                          sx={{
                            py: 2,
                            px: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2.5,
                          }}
                        >
                          <Box sx={{ flexShrink: 0 }}>
                            <FridgeMobileStatus report={fridge.report} />
                          </Box>
                          <ListItemText
                            primary={fridge.name}
                            primaryTypographyProps={{
                              variant: 'body1',
                              fontWeight: 800,
                              color: 'text.primary',
                              letterSpacing: '-0.02em',
                              fontSize: '1.1rem',
                            }}
                            secondary={`${fridge.location.street}, ${fridge.location.city}`}
                            secondaryTypographyProps={{
                              variant: 'body2',
                              color: 'text.secondary',
                              noWrap: true,
                              fontSize: '0.95rem',
                              mt: 0.5,
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography
                      variant="body1"
                      fontWeight={600}
                      color="text.primary"
                      gutterBottom
                    >
                      No fridges found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Try searching for a different name or street
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </ClickAwayListener>
      )}

      {/* List Area */}
      <Box
        sx={{
          flex: 1,
          display: {
            xs: currentView === 'list' ? 'flex' : 'none',
            md: 'flex',
          },
          flexDirection: 'column',
          px: { xs: 0, md: 4 }, // No padding on mobile, flush to edges
          pt: { xs: 0, md: 2 },
          pb: 2,
          overflowY: 'hidden',
          height: '100%',
        }}
      >
        <Box
          sx={{
            display: 'block',
            pt: { xs: 2, md: 3 },
            px: { xs: 2, md: 0 },
            pb: 1,
            position: 'sticky',
            top: 0,
            backgroundColor: 'background.paper',
            zIndex: 10,
          }}
        >
          <Typography
            component="h1"
            sx={{
              display: { xs: 'none', md: 'block' },
              fontSize: '1.2rem',
              fontWeight: 800,
              color: 'text.primary',
              letterSpacing: '-0.02em',
              textAlign: 'center',
              mb: 3,
            }}
          >
            Fridges in this area
          </Typography>
          <SearchMap
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            hideCloseIcon
            sx={{ mb: 1.5 }}
          />
          <FilterPills
            activeFilters={activeFilters}
            onToggle={toggleFilter}
            sx={{ mb: { xs: 2, md: 3 } }}
          />
        </Box>
        <StateBoundary
          status={status}
          error={error}
          onRetry={fetchFridges}
          loadingView={<FridgeListSkeleton />}
        >
          <Box sx={{ flex: 1, overflowY: 'auto', px: { xs: 2, md: 0 } }}>
            {isSearching ? (
              <FridgeListSkeleton />
            ) : (
              <FridgeList
                fridges={filteredFridges}
                onFridgeSelect={(id) => {
                  setSelectedFridgeId(id);
                  setCurrentView('map');
                }}
              />
            )}
          </Box>
        </StateBoundary>
      </Box>

      {/* Map Area */}
      <Box
        sx={{
          flex: { xs: 1, md: 2.5 },
          display: {
            xs: currentView === 'map' ? 'block' : 'none',
            md: 'block',
          },
          position: 'relative',
          height: '100%',
        }}
      >
        <MemoizedMap
          fridges={mapFridgesSnapshot}
          onMarkerClick={setSelectedFridgeId}
          mapRef={mapRef}
          hideLegend={currentView === 'list'}
        />
        {/* Floating button stack — bottom-right corner of map */}
        <Stack
          direction="column"
          spacing={1.5}
          sx={{
            position: 'absolute',
            bottom: 32,
            right: 10,
            zIndex: 1000,
            alignItems: 'center',
          }}
        >
          {/* Locate button — always visible */}
          <Tooltip title="Find my location" placement="left">
            <Box
              onDoubleClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              <Fab
                onClick={handleLocate}
                size="medium"
                aria-label="Find my location"
                sx={{
                  backgroundColor: 'white',
                  color: userLocation
                    ? designColor.blue.interactive
                    : 'text.secondary',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                  width: 48,
                  height: 48,
                  '&:hover': {
                    backgroundColor: 'white',
                    boxShadow: 'none',
                  },
                }}
              >
                <MyLocationIcon sx={{ fontSize: 24 }} />
              </Fab>
            </Box>
          </Tooltip>
          {/* Filter toggle — mobile only */}
          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <Badge badgeContent={activeFilters.size} color="primary">
              <Fab
                size="medium"
                onClick={() => {
                  const next = !showFilters;
                  trackEvent({
                    action: 'filter_panel_toggle',
                    category: 'fridge_browse',
                    label: next ? 'open' : 'close',
                  });
                  setShowFilters(next);
                }}
                aria-label="Toggle filters"
                sx={{
                  backgroundColor: showFilters
                    ? designColor.blue.interactive
                    : 'white',
                  backdropFilter: 'blur(8px)',
                  color: showFilters ? 'white' : 'text.secondary',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                  width: 48,
                  height: 48,
                  '&:hover, &:focus, &:focus-visible, &.Mui-focusVisible, &:active':
                    {
                      backgroundColor: showFilters
                        ? designColor.blue.interactive
                        : 'white',
                      color: showFilters ? 'white' : 'text.secondary',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                    },
                }}
              >
                <TuneIcon sx={{ fontSize: 24 }} />
              </Fab>
            </Badge>
          </Box>
        </Stack>
      </Box>

      {/* Map Toggle (Mobile Only) */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <MapToggle currentView={currentView} setView={setCurrentView} />
      </Box>
    </Box>
  );
}
