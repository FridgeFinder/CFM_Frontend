'use client';

import React, { useLayoutEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  Button,
  Box,
  Divider,
  Link,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import {
  CalendarMonth as CalendarMonthIcon,
  CheckCircle as CheckCircleIcon,
  ChatBubbleOutlineOutlined as ChatBubbleOutlineOutlinedIcon,
  InfoOutlined as InfoOutlinedIcon,
  Instagram as InstagramIcon,
  Language as LanguageIcon,
  PlaceOutlined as MapPinIcon,
  Edit as EditIcon,
} from '@mui/icons-material';

import { ButtonLink, SoftWrap } from 'components/ui';
import { FridgeBackButton } from './FridgeBackButton';
import { ShareButton } from './ShareButton';
import { FollowButton } from './FollowButton';
import { LocalTimestamp } from './LocalTimestamp';
import { Fridge, FridgeReport, Maintainer } from 'types/domain';
import {
  MapLegendConditionDirtyIcon,
  MapLegendConditionOutOfOrderIcon,
  MapLegendPinLocationIcon,
  MapLegendPinNotAtLocationIcon,
  MapLegendPinGhostIcon,
} from 'theme/icons';
import { pinColor, designColor } from 'theme/palette';
import { foodLevelConfig } from 'config/foodLevel';
import { FridgeActivity } from './FridgeActivity';
import { FridgeReportImage } from './FridgeReportImage';

// ---------------------------------------------------------------------------
// Condition map
// ---------------------------------------------------------------------------
const enumCondition: Record<string, { text: string }> = {
  good: { text: 'Fridge is Working Properly' },
  dirty: { text: 'Fridge Needs Cleaning' },
  'out of order': { text: 'Fridge Needs Repairs' },
  'not at location': { text: 'Fridge is No Longer at Location' },
  ghost: { text: 'Fridge is Permanently Unavailable' },
};

// ---------------------------------------------------------------------------
// Condition icons (imported from theme/icons)
// ---------------------------------------------------------------------------

function ConditionIcon({
  condition,
}: {
  condition: string;
}): React.ReactElement {
  const c = condition.toLowerCase();
  if (c === 'dirty')
    return (
      <MapLegendConditionDirtyIcon
        sx={{
          width: 28,
          height: 28,
          color: designColor.conditionIcon,
          flexShrink: 0,
        }}
      />
    );
  if (c === 'out of order')
    return (
      <MapLegendConditionOutOfOrderIcon
        sx={{
          width: 28,
          height: 28,
          color: designColor.conditionIcon,
          flexShrink: 0,
        }}
      />
    );
  if (c === 'good')
    return (
      <CheckCircleIcon
        sx={{ color: designColor.green.success, fontSize: 28, flexShrink: 0 }}
      />
    );
  if (c === 'not at location')
    return (
      <MapLegendPinNotAtLocationIcon
        sx={{
          width: 28,
          height: 28,
          color: pinColor.fridgeNotAtLocation,
          flexShrink: 0,
        }}
      />
    );
  if (c === 'ghost')
    return (
      <MapLegendPinGhostIcon
        sx={{
          width: 28,
          height: 28,
          color: pinColor.fridgeGhost,
          flexShrink: 0,
        }}
      />
    );
  // unknown — grey dot
  return (
    <Box
      sx={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        backgroundColor: '#6B7280',
        flexShrink: 0,
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function CaptionLabel({
  caption,
}: {
  caption?: string | null;
}): React.ReactElement | null {
  if (!caption) return null;

  return (
    <Typography
      component="span"
      sx={{ fontWeight: 700, color: designColor.neroGray, mr: 1 }}
    >
      {caption}:
    </Typography>
  );
}

interface ImageContainerProps {
  src?: string | null;
  alt: string;
  isAboveFold?: boolean;
}

function ImageContainer({
  src = null,
  alt,
  isAboveFold = false,
}: ImageContainerProps): React.ReactElement | null {
  if (!src) return null;
  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        maxHeight: { xs: 325, md: 350 },
        aspectRatio: '1 / 1.1',
        display: 'flex',
        justifyContent: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: '20px',
        overflow: 'hidden',
      }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        style={{ objectFit: 'contain' }}
        priority={isAboveFold}
      />
    </Box>
  );
}

interface LinkLineProps {
  icon: React.ElementType;
  obj?: Maintainer | null;
  url: 'instagram' | 'website';
}

function LinkLine({
  icon: IconComponent,
  obj,
  url,
}: LinkLineProps): React.ReactElement | null {
  if (!obj) return null;
  if (url === 'instagram' && obj.instagram) {
    const instagramRegex =
      /(?:(?:http|https):\/\/)?(?:www\.)?(?:instagram\.com|instagr\.am|instagr\.com)\/([\.\w]+)/gim;
    const match = instagramRegex.exec(obj.instagram);
    const handle = match ? match[1] : obj.instagram;
    return (
      <Stack
        direction="row"
        alignItems="center"
        gap="12px"
        sx={{ minWidth: 0, width: '100%' }}
      >
        <IconComponent
          sx={{ fontSize: '1.83rem', color: '#666', flexShrink: 0 }}
        />
        <Link
          href={obj.instagram}
          variant="body1"
          sx={{
            color: designColor.blue.dark,
            minWidth: 0,
            maxWidth: '100%',
            display: 'block',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
            whiteSpace: 'normal',
          }}
        >
          {`@${handle}`}
        </Link>
      </Stack>
    );
  }
  if (url === 'website' && obj.website) {
    return (
      <Stack
        direction="row"
        alignItems="center"
        gap="12px"
        sx={{ minWidth: 0, width: '100%' }}
      >
        <IconComponent
          sx={{ fontSize: '1.83rem', color: '#666', flexShrink: 0 }}
        />
        <Link
          href={obj.website}
          variant="body1"
          sx={{
            color: designColor.blue.dark,
            minWidth: 0,
            maxWidth: '100%',
            display: 'block',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
            whiteSpace: 'normal',
          }}
        >
          {obj.website}
        </Link>
      </Stack>
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// Section label — small uppercase heading with indented content beneath it
// ---------------------------------------------------------------------------
function SectionDivider({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <Box>
      <Stack direction="row" alignItems="center" gap={1.5} mb={2}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: designColor.mutedText,
            textTransform: 'uppercase',
            fontSize: '0.65rem',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </Typography>
        <Divider sx={{ flex: 1, opacity: 0.2 }} />
      </Stack>
      <Stack direction="column" spacing={3}>
        {children}
      </Stack>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Info line (icon + bold label + value)
// ---------------------------------------------------------------------------
interface InfoRowProps {
  icon: React.ReactElement;
  label: string;
  value: React.ReactNode;
}

function InfoRow({ icon, label, value }: InfoRowProps): React.ReactElement {
  return (
    <Stack direction="row" alignItems="center" gap="12px">
      <Box
        sx={{
          width: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Typography variant="body1">
        <CaptionLabel caption={label} />
        {typeof value === 'string' ? <SoftWrap text={value} /> : value}
      </Typography>
    </Stack>
  );
}

interface NotesRowProps {
  icon: React.ReactElement;
  label: string;
  text?: string | null;
}

function NotesRow({
  icon,
  label,
  text,
}: NotesRowProps): React.ReactElement | null {
  if (!text) return null;
  return (
    <Stack direction="row" alignItems="flex-start" gap="12px">
      <Box
        sx={{
          width: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          mt: '2px',
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography
          component="span"
          sx={{ fontWeight: 700, color: designColor.neroGray }}
        >
          {label}:
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: designColor.neroGray, mt: 0.5 }}
        >
          {text}
        </Typography>
      </Box>
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// FridgeContainer — top section (name, address, image, action buttons)
// ---------------------------------------------------------------------------
interface FridgeContainerProps {
  fridge: Fridge;
}

function FridgeContainer({
  fridge,
}: FridgeContainerProps): React.ReactElement | null {
  if (!fridge) return null;

  const {
    name,
    location,
    maintainer = null,
    photoUrl = '/feedback/happyFridge.svg',
    notes = null,
  } = fridge;
  const address = `${location.street}, ${location.city}, ${location.state} ${location.zip}`;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Back button + name/address — grouped tight */}
      <Box>
        <FridgeBackButton />
        <Box>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: designColor.neroGray,
              mt: 0,
              mb: 0.5,
            }}
          >
            {name}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: '#505050', fontWeight: 500 }}
          >
            {address}
          </Typography>
        </Box>
      </Box>

      {/* Fridge hero image */}
      <ImageContainer src={photoUrl} alt="Picture of the fridge" isAboveFold />

      {/* Action buttons */}
      <Stack direction="row" gap={{ xs: 1.5, md: 2 }}>
        <FollowButton fridgeId={fridge.id} fridgeName={name} />

        <Button
          component="a"
          href={encodeURI(`https://www.google.com/maps/place/${address}`)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Click to get directions to the fridge"
          variant="outlined"
          sx={{
            flex: 0.84,
            borderRadius: '999px',
            fontWeight: 700,
            fontSize: { xs: '0.75rem', md: '1rem' },
            lineHeight: { xs: '1rem', md: '1.25rem' },
            py: { xs: 1.25, md: 1.125 },
            px: { xs: 0.625, md: 1.125 },
            minHeight: { xs: 40, md: 44 },
            border: `2px solid ${designColor.blue.dark}`,
            color: designColor.blue.dark,
            whiteSpace: 'nowrap',
            display: 'flex',
            minWidth: 0,
            gap: { xs: '6px', md: '8px' },
            '& .MuiSvgIcon-root': { color: designColor.blue.dark },
            '& .directions-label': { color: designColor.blue.dark },
            '&:hover': {
              backgroundColor: designColor.blue.dark,
              color: designColor.white,
              border: `2px solid ${designColor.blue.dark}`,
              '& .MuiSvgIcon-root': { color: designColor.white },
              '& .directions-label': { color: designColor.white },
            },
            textTransform: 'uppercase',
          }}
        >
          <MapPinIcon
            sx={{
              fontSize: { xs: '1rem', md: '1.25rem' },
              color: designColor.blue.dark,
            }}
          />
          <Box component="span" className="directions-label">
            Directions
          </Box>
        </Button>

        <ShareButton fridgeName={name} />
      </Stack>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// ReportContainer — latest report section
// ---------------------------------------------------------------------------
interface ReportContainerProps {
  report?: FridgeReport | null;
}

export function ReportContainer({
  report,
}: ReportContainerProps): React.ReactElement | null {
  if (!report) return null;

  const {
    timestamp,
    condition,
    foodPercentage,
    photoUrl = null,
    notes = null,
  } = report;

  const reportDate = <LocalTimestamp timestamp={timestamp} />;

  const conditionLabel = enumCondition[condition]?.text ?? condition;

  const foodEntry = foodLevelConfig[foodPercentage];
  const foodLabel = foodEntry?.label ?? 'Unknown';
  const foodColor = foodEntry?.color ?? pinColor.itemsEmpty;

  return (
    <Stack direction="column" spacing={2}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          letterSpacing: '0.1em',
          color: designColor.mutedText,
          textTransform: 'uppercase',
          fontSize: '0.65rem',
          whiteSpace: 'nowrap',
        }}
      >
        Status
      </Typography>
      <Stack direction="column" spacing={3}>
        <InfoRow
          icon={
            <CalendarMonthIcon
              sx={{ fontSize: '1.67rem', color: designColor.neroGray }}
            />
          }
          label="Latest Report"
          value={reportDate}
        />
        <InfoRow
          icon={<ConditionIcon condition={condition} />}
          label="Condition"
          value={conditionLabel}
        />
        <InfoRow
          icon={
            <MapLegendPinLocationIcon
              sx={{ width: 32, height: 32, color: foodColor }}
            />
          }
          label="Food Level"
          value={foodLabel}
        />
        <NotesRow
          icon={
            <ChatBubbleOutlineOutlinedIcon
              sx={{ fontSize: '1.67rem', color: designColor.neroGray }}
            />
          }
          label="Notes"
          text={notes}
        />
        {photoUrl && (
          <FridgeReportImage
            src={photoUrl}
            alt="Picture of the food within the fridge"
            expandedAlt="Expanded picture of the food within the fridge"
            borderRadius="20px"
          />
        )}
      </Stack>
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// FridgeInformation — root export
// ---------------------------------------------------------------------------
export interface FridgeInformationProps {
  fridge: Fridge;
  fridgeReportSection?: React.ReactNode;
}

export function FridgeInformation({
  fridge,
  fridgeReportSection,
}: FridgeInformationProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<'info' | 'activity'>('info');
  const scrollPositionRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (scrollPositionRef.current === null) return;

    const frame = window.requestAnimationFrame(() => {
      if (scrollPositionRef.current === null) return;
      window.scrollTo(0, scrollPositionRef.current);
      scrollPositionRef.current = null;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeTab]);

  return (
    <>
      <Box sx={{ maxWidth: 896, mx: 'auto', width: '100%' }}>
        <Stack
          direction="column"
          spacing={3}
          px={2}
          pt={2}
          mb={{ xs: activeTab === 'info' ? '72px' : 0, md: 4 }}
          sx={{ overflowAnchor: 'none' }}
        >
          <FridgeContainer fridge={fridge} />
          <Box>
            <Tabs
              value={activeTab}
              onChange={(_, value: 'info' | 'activity') => {
                scrollPositionRef.current = window.scrollY;
                setActiveTab(value);
              }}
              aria-label="Fridge information and activity"
              variant="fullWidth"
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiTab-root': {
                  fontWeight: 700,
                  fontSize: '1.125rem',
                  textTransform: 'none',
                  transition: 'background-color 150ms ease-in-out',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                },
                '& .MuiTab-root:not(.Mui-selected)': {
                  color: designColor.secondaryText,
                },
                '& .MuiTab-root.MuiTab-labelIcon': {
                  minHeight: 48,
                  paddingTop: '12px',
                  paddingBottom: '12px',
                },
              }}
            >
              <Tab
                icon={
                  <svg
                    aria-hidden="true"
                    focusable="false"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                    <line x1="5" y1="11" x2="19" y2="11" />
                    <line x1="15" y1="5.5" x2="15" y2="7.5" />
                    <line x1="15" y1="15" x2="15" y2="17" />
                  </svg>
                }
                iconPosition="start"
                label="Info"
                value="info"
                id="fridge-info-tab"
                aria-controls="fridge-info-panel"
              />
              <Tab
                icon={
                  <svg
                    aria-hidden="true"
                    focusable="false"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                }
                iconPosition="start"
                label="Activity"
                value="activity"
                id="fridge-activity-tab"
                aria-controls="fridge-activity-panel"
              />
            </Tabs>
            <Stack
              role="tabpanel"
              id="fridge-info-panel"
              aria-labelledby="fridge-info-tab"
              aria-hidden={activeTab !== 'info'}
              direction="column"
              spacing={3}
              pt={3}
              sx={{ display: activeTab === 'info' ? 'flex' : 'none' }}
            >
              {fridgeReportSection}
              <SectionDivider label="Fridge Host Info">
                {fridge.notes && (
                  <Stack direction="row" alignItems="flex-start" gap="12px">
                    <InfoOutlinedIcon
                      sx={{
                        fontSize: '1.83rem',
                        color: '#666',
                        flexShrink: 0,
                        mt: '2px',
                      }}
                    />
                    <Box>
                      <Typography
                        component="span"
                        sx={{ fontWeight: 700, color: designColor.neroGray }}
                      >
                        Details:
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ color: designColor.neroGray, mt: 0.5 }}
                      >
                        {fridge.notes}
                      </Typography>
                    </Box>
                  </Stack>
                )}
                <LinkLine
                  icon={InstagramIcon}
                  obj={fridge.maintainer ?? null}
                  url="instagram"
                />
                <LinkLine
                  icon={LanguageIcon}
                  obj={fridge.maintainer ?? null}
                  url="website"
                />
              </SectionDivider>
            </Stack>
            <Box
              role="tabpanel"
              id="fridge-activity-panel"
              aria-labelledby="fridge-activity-tab"
              aria-hidden={activeTab !== 'activity'}
              sx={{
                display: activeTab === 'activity' ? 'block' : 'none',
                pt: 3,
              }}
            >
              <FridgeActivity
                key={fridge.id}
                fridgeId={fridge.id}
                fridgeName={fridge.name}
                isActive={activeTab === 'activity'}
              />
            </Box>
          </Box>
        </Stack>

        {/* Desktop inline Update Status button */}
        {activeTab === 'info' && (
          <Box sx={{ display: { xs: 'none', md: 'block' }, px: 2, mb: 4 }}>
            <ButtonLink
              aria-label="Click to report the status of the fridge"
              variant="contained"
              to={`/fridge/${fridge.id}/report?from=${encodeURIComponent(`/fridge/${fridge.id}`)}&name=${encodeURIComponent(fridge.name)}`}
              title="Update Status"
              sx={{
                width: 'calc(100% - 16px)',
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
              startIcon={
                <EditIcon sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }} />
              }
            />
          </Box>
        )}
      </Box>

      {/* Mobile sticky Update Status button */}
      {activeTab === 'info' && (
        <Box
          sx={{
            display: { xs: 'block', md: 'none' },
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: designColor.white,
            borderTop: '1px solid rgba(0,0,0,0.12)',
            px: 2,
            py: 1.5,
            zIndex: 40,
            boxShadow: '0 -2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <ButtonLink
            aria-label="Click to report the status of the fridge"
            variant="contained"
            to={`/fridge/${fridge.id}/report?from=${encodeURIComponent(`/fridge/${fridge.id}`)}&name=${encodeURIComponent(fridge.name)}`}
            title="Update Status"
            sx={{
              width: '96%',
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
            startIcon={
              <EditIcon sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }} />
            }
          />
        </Box>
      )}
    </>
  );
}
