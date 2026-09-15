'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { alpha } from '@mui/material/styles';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  NotificationsNoneOutlined as NotificationsNoneOutlinedIcon,
  ShowChartOutlined as ShowChartOutlinedIcon,
} from '@mui/icons-material';
import { BrandButton } from 'components/ui';
import { NEW_USER_ONBOARDING_KEY } from 'features/auth/utils/registerNewUser';
import { designColor } from 'theme/palette';

const FOLLOW_VIDEO_SRC = '/onboarding/follow_steps_7.mp4';
const STATS_IMAGE_SRC = '/onboarding/profile_preview_blue.webp';
const ENDING_IMAGE_SRC = '/onboarding/ending.svg';
const THEME_BACKGROUND = '#EEF3FF';
const DEFAULT_FINAL_CTA_LABEL = 'Find a Fridge ->';
const FRIDGE_ROUTE_PREFIX = '/fridge';

const steps = ['welcome', 'follow', 'stats', 'map'] as const;
type StepId = (typeof steps)[number];

interface NewUserWelcomeFlowProps {
  open: boolean;
  onClose: () => void;
}

// --- SHARED STYLES & SUB-COMPONENTS ---

const STEP_TYPOGRAPHY = {
  heading: {
    fontSize: { xs: '1.6rem' },
    fontWeight: 800,
    lineHeight: 1.2,
    color: designColor.neroGray,
    textAlign: 'center',
  },
  subheading: {
    mt: 0,
    textAlign: 'center',
    color: alpha(designColor.neroGray, 0.7),
    lineHeight: 1.6,
  },
};

const SKIP_BUTTON_SX = {
  borderRadius: '999px',
  px: 4,
  py: 1,
  fontSize: '0.875rem',
  fontWeight: 700,
  color: alpha(designColor.blue.dark, 0.5),
  border: `1.5px solid ${alpha(designColor.blue.dark, 0.2)}`,
  '&:hover': {
    border: `1.5px solid ${alpha(designColor.blue.dark, 0.35)}`,
    bgcolor: alpha(designColor.blue.light, 0.35),
  },
};

const BACK_BUTTON_SX = {
  mt: 0.75,
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '0.875rem',
  color: alpha(designColor.blue.dark, 0.5),
  minWidth: 0,
  alignSelf: 'center',
};

function StepHeader({
  title,
  subtitle,
  mb = 4,
}: {
  title: string;
  subtitle: string;
  mb?: number;
}) {
  return (
    <Box sx={{ flexShrink: 0, mb }}>
      <Typography variant="h2" sx={STEP_TYPOGRAPHY.heading}>
        {title}
      </Typography>
      <Typography
        variant="body1"
        sx={{
          ...STEP_TYPOGRAPHY.subheading,
          mt: subtitle ? 1 : 0,
          fontSize: { xs: '1rem' },
        }}
      >
        {subtitle}
      </Typography>
    </Box>
  );
}

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
      {Array.from({ length: total }).map((_, index) => (
        <Box
          key={String(index)}
          sx={{
            width: index === current ? 20 : 8,
            height: 8,
            borderRadius: 999,
            backgroundColor:
              index === current ? designColor.blue.dark : designColor.blue.pale,
            transition: 'all 180ms ease',
          }}
        />
      ))}
    </Box>
  );
}

function WelcomeInfoCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactElement;
  title: string;
  description: string;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 3,
        p: 3,
        borderRadius: '14px',
        bgcolor: designColor.white,
        boxShadow: `0 1px 3px ${alpha(designColor.blue.dark, 0.08)}`,
      }}
    >
      <Box
        sx={{
          mt: 0.25,
          width: 32,
          height: 32,
          borderRadius: '50%',
          bgcolor: alpha(designColor.blue.light, 0.35),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            mb: 0.3,
            fontSize: { xs: '0.875rem', md: '0.95rem' },
            lineHeight: 1.25,
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: alpha(designColor.neroGray, 0.8),
            fontSize: { xs: '0.8125rem', md: '0.875rem' },
            lineHeight: 1.45,
          }}
        >
          {description}
        </Typography>
      </Box>
    </Box>
  );
}

// --- INDEPENDENT STEP VIEW COMPONENTS ---

function WelcomeStep(): React.ReactElement {
  const infoCards = [
    {
      title: 'Stay informed',
      description:
        'Get alerted when fridges you follow get filled, need cleaning, or have important updates.',
      icon: (
        <NotificationsNoneOutlinedIcon
          sx={{ fontSize: '1.25rem', color: designColor.blue.dark }}
        />
      ),
    },
    {
      title: 'Track your contributions',
      description:
        "View how many fridges you've filled, cleaned, and helped repair.",
      icon: (
        <ShowChartOutlinedIcon
          sx={{ fontSize: '1.25rem', color: designColor.blue.dark }}
        />
      ),
    },
  ];

  return (
    <Box sx={{ px: { xs: 4, sm: 6 }, pb: { xs: 4 } }}>
      <Box
        component="img"
        src="/card/paragraph/pearTomatoAndFridge.svg"
        alt="Picture of pear dancing with tomatoes stacked on top of each other"
        sx={{ display: 'block', width: 220, mx: 'auto', mb: 3 }}
      />

      <StepHeader
        title="Welcome to Fridge Finder!"
        subtitle="What your new account lets you do:"
        mb={4}
      />

      <Stack spacing={2.5} sx={{ maxWidth: 680, mx: 'auto' }}>
        {infoCards.map((card) => (
          <WelcomeInfoCard
            key={card.title}
            icon={card.icon}
            title={card.title}
            description={card.description}
          />
        ))}
      </Stack>
    </Box>
  );
}

function FollowStep(): React.ReactElement {
  const [videoFailed, setVideoFailed] = useState(false);

  return (
    <Box
      sx={{
        px: { xs: 4, sm: 6 },
        pt: 0,
        pb: 4,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <StepHeader
        title="Follow Fridges"
        subtitle="Get alerted when fridges get filled, need cleaning, or have important updates."
        mb={0}
      />

      <Box
        sx={{
          flex: 1,
          mt: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 0,
        }}
      >
        {!videoFailed ? (
          <Box
            component="video"
            src={FOLLOW_VIDEO_SRC}
            autoPlay
            muted
            loop
            playsInline
            onError={() => setVideoFailed(true)}
            sx={{
              width: 'auto',
              height: 'auto',
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              borderRadius: '16px',
              boxShadow: `0 2px 12px ${alpha(designColor.black, 0.1)}`,
            }}
          />
        ) : (
          <Typography
            variant="body2"
            sx={{ color: alpha(designColor.neroGray, 0.65), px: 3, py: 4 }}
          >
            We could not load this video right now.
          </Typography>
        )}
      </Box>
    </Box>
  );
}

// Keep explicit independent structural heights intact
function StatsStep(): React.ReactElement {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <Box sx={{ px: { xs: 4, sm: 6 }, pt: 0, pb: 4 }}>
      <StepHeader
        title="Track Your Activity"
        subtitle="Go to your profile to see your stats and activity. Make fridge reports to start earning points."
        mb={4}
      />

      <Box
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {!imageFailed ? (
          <Box
            component="img"
            src={STATS_IMAGE_SRC}
            alt="User profile showing activity stats"
            onError={() => setImageFailed(true)}
            sx={{
              width: '100%',
              height: 'auto',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: `0 2px 12px ${alpha(designColor.black, 0.1)}`,
            }}
          />
        ) : (
          <Typography
            variant="body2"
            sx={{ color: alpha(designColor.neroGray, 0.65), px: 3, py: 4 }}
          >
            We could not load this image right now.
          </Typography>
        )}
      </Box>
    </Box>
  );
}

function MapStep(): React.ReactElement {
  return (
    <Box sx={{ px: { xs: 3, sm: 6 }, pt: { xs: 4, sm: 5 }, pb: 1 }}>
      <Box sx={{ mx: 'auto', width: 220, mb: 2.5 }}>
        <Box
          component="img"
          src={ENDING_IMAGE_SRC}
          alt="Ending illustration"
          sx={{ width: '100%', height: 'auto', display: 'block' }}
        />
      </Box>

      <Box sx={{ textAlign: 'center' }}>
        <Typography
          variant="h2"
          sx={{
            ...STEP_TYPOGRAPHY.heading,
            fontSize: { xs: '2.1rem', sm: '2.25rem' },
          }}
        >
          Ready to Start?
        </Typography>
        <Typography
          variant="body1"
          sx={{
            ...STEP_TYPOGRAPHY.subheading,
            mt: 1.25,
            color: alpha(designColor.neroGray, 0.75),
            lineHeight: 1.65,
          }}
        >
          Browse our map to find fridges near you. Follow a fridge and make your
          first status report!
        </Typography>
      </Box>
    </Box>
  );
}

// --- CONTAINER COMPONENT ---

export function NewUserWelcomeFlow({
  open,
  onClose,
}: NewUserWelcomeFlowProps): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeStep, setActiveStep] = useState(0);

  const isLastStep = useMemo(
    () => activeStep === steps.length - 1,
    [activeStep]
  );

  const isFridgeRoute = !!pathname?.startsWith(FRIDGE_ROUTE_PREFIX);

  const finalCtaLabel = isFridgeRoute ? 'Continue' : DEFAULT_FINAL_CTA_LABEL;

  const completeFlow = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(NEW_USER_ONBOARDING_KEY, 'completed');
    }
    onClose();
  };

  const handleNext = () => {
    if (isLastStep) {
      completeFlow();
      if (!isFridgeRoute) {
        router.push('/browse');
      }
      return;
    }
    setActiveStep((step) => step + 1);
  };

  const handleBack = () => {
    setActiveStep((step) => Math.max(step - 1, 0));
  };

  const currentStep = steps[activeStep] as StepId;

  return (
    <Dialog
      open={open}
      onClose={completeFlow}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      slotProps={{
        paper: {
          sx: {
            borderRadius: { xs: 0, sm: '24px' },
            overflow: 'hidden',
            border: `1px solid ${designColor.borderGray}`,
            backgroundColor: THEME_BACKGROUND,
            width: { xs: '100%', sm: 500 },
            height: { xs: '100%', sm: 700 },
            m: 0,
          },
        },
      }}
    >
      <DialogContent
        sx={{
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          backgroundColor: THEME_BACKGROUND,
        }}
      >
        {/* Top Header Bar */}
        <Box
          sx={{
            px: { xs: 3.75, sm: 2 },
            pt: { xs: 3.25, sm: 1.75 },
            pb: { xs: 2.25, sm: 1.5 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              color: alpha(designColor.blue.dark, 0.5),
            }}
          >
            {activeStep + 1} / {steps.length}
          </Typography>

          <Button
            onClick={completeFlow}
            endIcon={<CloseIcon sx={{ fontSize: '0.9375rem' }} />}
            sx={SKIP_BUTTON_SX}
          >
            Skip
          </Button>
        </Box>

        {/* Dynamic Inner Step Target Container */}
        <Box
          sx={{
            flex: 1,
            overflowY: { xs: 'auto', sm: 'hidden' },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {currentStep === 'welcome' && <WelcomeStep />}
          {currentStep === 'follow' && <FollowStep />}
          {currentStep === 'stats' && <StatsStep />}
          {currentStep === 'map' && <MapStep />}
        </Box>

        {/* Bottom Actions Row */}
        <Box
          sx={{
            px: 0,
            pt: 3,
            pb: activeStep > 0 ? { xs: 2.5, sm: 2.5 } : { xs: 5, sm: 5 },
            borderTop: `1px solid ${alpha(designColor.blue.dark, 0.08)}`,
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
          }}
        >
          <Box sx={{ mb: 3.5 }}>
            <StepDots total={steps.length} current={activeStep} />
          </Box>

          <BrandButton
            onClick={handleNext}
            sx={{
              py: 2.3,
              px: 4,
              width: '88%',
              alignSelf: 'center',
              borderRadius: '45px',
              fontSize: '1rem',
              fontWeight: 700,
              letterSpacing: '0.02em',
            }}
          >
            {isLastStep ? finalCtaLabel : 'Next'}
          </BrandButton>

          {activeStep > 0 ? (
            <Button onClick={handleBack} variant="text" sx={BACK_BUTTON_SX}>
              {'<- Back'}
            </Button>
          ) : null}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
