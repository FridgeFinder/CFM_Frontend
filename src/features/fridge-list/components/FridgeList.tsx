import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { flushSync } from 'react-dom';
import {
  List as VirtualList,
  type DynamicRowHeight,
  type ListImperativeAPI,
  type RowComponentProps,
} from 'react-window';
import {
  IconButton,
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
  resetKey?: string;
}

function FridgeListItem({
  fridge,
  isLast,
  onFridgeSelect,
}: {
  fridge: Fridge;
  isLast: boolean;
  onFridgeSelect?: (id: string) => void;
}): React.ReactElement {
  const { trackEvent } = useAnalytics();
  return (
    <ListItem
      component="div"
      divider={!isLast}
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
          flexWrap="wrap"
          useFlexGap
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
          {fridge.report?.condition !== 'ghost' && (
            <ButtonLink
              variant="contained"
              to={`/fridge/${fridge.id}/report?from=${encodeURIComponent('/browse')}&name=${encodeURIComponent(fridge.name)}`}
              aria-label={`Update Status on ${fridge.name}`}
              sx={{ fontSize: '0.85rem', py: 1.5, px: 4 }}
              title="Update status"
            />
          )}
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
  );
}

function FridgeRow({
  index,
  style,
  ariaAttributes,
  fridges,
  onFridgeSelect,
}: RowComponentProps<FridgeListProps>): React.ReactElement {
  const fridge = fridges[index];
  const isLast = index === fridges.length - 1;

  return (
    <div style={style} {...ariaAttributes}>
      <FridgeListItem
        key={fridge.id}
        fridge={fridge}
        isLast={isLast}
        onFridgeSelect={onFridgeSelect}
      />
      {isLast && <div aria-hidden="true" style={{ height: 120 }} />}
    </div>
  );
}

function rowFocusTargets(row: HTMLElement): NodeListOf<HTMLElement> {
  return row.querySelectorAll<HTMLElement>(
    'a[href], button:not(:disabled), [tabindex="0"]'
  );
}

const DEFAULT_ROW_HEIGHT = 320;
const ROW_INDEX_ATTRIBUTE = 'data-react-window-index';

function rowSignature(fridge: Fridge, isLast: boolean): string {
  const { id, name, location, report } = fridge;
  return JSON.stringify([id, name, location, report, isLast]);
}

// react-window's built-in height cache is indexed by position, so re-sorting
// the list (e.g. after panning the map) would discard every measurement and
// make rows jump. Caching by fridge content keeps heights stable across reorders.
function useFridgeRowHeights(
  fridges: Fridge[],
  width: number
): DynamicRowHeight {
  const [cache, setCache] = useState(() => ({
    width,
    heights: new Map<string, number>(),
  }));
  const signatures = useMemo(
    () =>
      fridges.map((fridge, index) =>
        rowSignature(fridge, index === fridges.length - 1)
      ),
    [fridges]
  );
  const latest = useRef({ signatures, width });
  useLayoutEffect(() => {
    latest.current = { signatures, width };
  }, [signatures, width]);

  const heights = cache.width === width ? cache.heights : null;

  const setRowHeight = useCallback((index: number, size: number) => {
    const signature = latest.current.signatures[index];
    if (signature === undefined) return;
    setCache((prev) => {
      const currentWidth = latest.current.width;
      const base = prev.width === currentWidth ? prev.heights : null;
      if (base?.get(signature) === size) return prev;
      const next = new Map(base ?? []);
      next.set(signature, size);
      return { width: currentWidth, heights: next };
    });
  }, []);

  const observerRef = useRef<ResizeObserver | null>(null);
  const observeRowElements = useCallback(
    (elements: Element[] | NodeListOf<Element>) => {
      if (typeof ResizeObserver === 'undefined') return () => {};
      observerRef.current ??= new ResizeObserver((entries) => {
        // ResizeObserver runs after layout but before paint; flushing here
        // applies real heights in the same frame instead of painting estimates.
        flushSync(() => {
          for (const { borderBoxSize, target } of entries) {
            const index = target.getAttribute(ROW_INDEX_ATTRIBUTE);
            const size = borderBoxSize?.[0]?.blockSize;
            if (index !== null && size) setRowHeight(Number(index), size);
          }
        });
      });
      const observer = observerRef.current;
      elements.forEach((element) => observer.observe(element));
      return () => elements.forEach((element) => observer.unobserve(element));
    },
    [setRowHeight]
  );
  useEffect(
    () => () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    },
    []
  );

  return useMemo(() => {
    let total = 0;
    heights?.forEach((size) => {
      total += size;
    });
    const average =
      heights && heights.size > 0 ? total / heights.size : DEFAULT_ROW_HEIGHT;
    return {
      getAverageRowHeight: () => average,
      getRowHeight: (index: number) => heights?.get(signatures[index]),
      setRowHeight,
      observeRowElements,
    };
  }, [heights, signatures, setRowHeight, observeRowElements]);
}

export const FridgeList = React.memo(function FridgeList({
  fridges,
  onFridgeSelect,
  resetKey,
}: FridgeListProps): React.ReactElement {
  const listRef = useRef<ListImperativeAPI | null>(null);
  const pendingFocus = useRef<{ index: number; fromEnd: boolean } | null>(null);
  const [width, setWidth] = useState(0);
  const orderKey = useMemo(
    () => JSON.stringify(fridges.map((fridge) => fridge.id)),
    [fridges]
  );
  const rowHeight = useFridgeRowHeights(fridges, width);
  const rowProps = useMemo(
    () => ({ fridges, onFridgeSelect }),
    [fridges, onFridgeSelect]
  );
  const handleResize = useCallback((size: { width: number }) => {
    setWidth(size.width);
  }, []);
  const handleRowsRendered = useCallback(() => {
    const pending = pendingFocus.current;
    if (!pending) return;
    const row = listRef.current?.element?.querySelector<HTMLElement>(
      `[role="listitem"][aria-posinset="${pending.index + 1}"]`
    );
    if (row) {
      const targets = rowFocusTargets(row);
      const target = targets[pending.fromEnd ? targets.length - 1 : 0];
      pendingFocus.current = null;
      target?.focus();
    }
  }, []);
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== 'Tab' || !(event.target instanceof HTMLElement)) return;
      const row = event.target.closest<HTMLElement>('[role="listitem"]');
      if (!row) return;
      const targets = rowFocusTargets(row);
      if (event.target !== targets[event.shiftKey ? 0 : targets.length - 1]) {
        return;
      }
      const index = Number(row.getAttribute('aria-posinset')) - 1;
      const nextIndex = index + (event.shiftKey ? -1 : 1);
      if (nextIndex < 0 || nextIndex >= fridges.length) return;
      if (
        listRef.current?.element?.querySelector(
          `[role="listitem"][aria-posinset="${nextIndex + 1}"]`
        )
      ) {
        return;
      }
      // Fast tabbing can outrun the overscan window. Mount the next row before
      // handing focus to it rather than letting Tab jump out of the list.
      event.preventDefault();
      pendingFocus.current = { index: nextIndex, fromEnd: event.shiftKey };
      listRef.current?.scrollToRow({
        index: nextIndex,
        behavior: 'instant',
      });
    },
    [fridges.length]
  );

  // Layout effect so the reset lands before paint; a passive effect would show
  // one frame of the new order at the old scroll position.
  useLayoutEffect(() => {
    pendingFocus.current = null;
    listRef.current?.element?.scrollTo({ top: 0, behavior: 'instant' });
  }, [orderKey, resetKey]);

  return (
    <VirtualList
      aria-label="Community fridges"
      listRef={listRef}
      rowComponent={FridgeRow}
      rowProps={rowProps}
      rowCount={fridges.length}
      rowHeight={rowHeight}
      overscanCount={5}
      onResize={handleResize}
      onRowsRendered={handleRowsRendered}
      onKeyDownCapture={handleKeyDown}
      style={{ height: '100%', minHeight: 0 }}
    />
  );
});
