import React from 'react';
import { Metadata } from 'next';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ButtonLink } from 'components/ui';
import {
  CleanedIcon,
  FilledIcon,
  MapLegendConditionDirtyIcon,
  ReportedIcon,
  MapLegendConditionOutOfOrderIcon,
  MapLegendPinGhostIcon,
  MapLegendPinLocationIcon,
  MapLegendPinNoReportIcon,
  MapLegendPinNotAtLocationIcon,
} from 'theme/icons';
import { designColor, pinColor } from 'theme/palette';

export const metadata: Metadata = {
  title: 'Fridge Finder: FAQs',
  description:
    'Answers about user types, points, and the icons used in the map view.',
};

type IconRowProps = {
  icon: React.ReactElement;
  title: string;
  description: string;
};

function IconRow({
  icon,
  title,
  description,
}: IconRowProps): React.ReactElement {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="flex-start"
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: designColor.borderGray,
        backgroundColor: 'background.paper',
      }}
    >
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          backgroundColor: designColor.whiteSmoke,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: 'text.primary',
          mt: 0.25,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h6" sx={{ mb: 0.25, color: 'text.primary' }}>
          {title}
        </Typography>
        <Typography
          variant="body2"
          sx={{ lineHeight: 1.7, color: 'text.secondary' }}
        >
          {description}
        </Typography>
      </Box>
    </Stack>
  );
}

function FaqAccordion({
  question,
  children,
  defaultExpanded = false,
}: {
  question: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}): React.ReactElement {
  return (
    <Accordion
      disableGutters
      elevation={0}
      defaultExpanded={defaultExpanded}
      square
      sx={{
        bgcolor: 'transparent',
        color: 'text.primary',
        borderTop: '1px solid',
        borderColor: designColor.borderGray,
        '&::before': { display: 'none' },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color: 'text.secondary' }} />}
        sx={{
          px: { xs: 2.5, md: 4 },
          py: 0.75,
          '& .MuiAccordionSummary-content': { my: 1.3 },
        }}
      >
        <Typography variant="h5" sx={{ color: 'text.primary' }}>
          {question}
        </Typography>
      </AccordionSummary>
      <AccordionDetails
        sx={{
          px: { xs: 3.5, md: 5 },
          pt: 0,
          pb: 2.5,
          color: 'text.secondary',
        }}
      >
        {children}
      </AccordionDetails>
    </Accordion>
  );
}

const pointRules = [
  {
    action: 'Fridge Report',
    points: 5,
    actionCountName: 'fridgeReportCount',
    detail: 'Awarded when a user submits a fridge status report.',
    icon: <ReportedIcon size={22} />,
  },
  {
    action: 'Fridge Filled',
    points: 10,
    actionCountName: 'filledCount',
    detail:
      'awarded when a status report is made with food in the fridge: "Few Items", "Many Items", or "Full".',
    icon: <FilledIcon size={22} />,
  },
  {
    action: 'Fridge Cleaned',
    points: 15,
    actionCountName: 'cleanedCount',
    detail:
      'awarded when a fridge status goes from "needs cleaning" to "good".',
    icon: <CleanedIcon size={22} />,
  },

  {
    action: 'Fridge Repaired',
    points: 25,
    actionCountName: 'repairedCount',
    detail: 'awarded when a fridge status goes from "needs repairs" to "good".',
    icon: (
      <MapLegendConditionOutOfOrderIcon
        sx={{ fontSize: 22, color: designColor.conditionIcon }}
      />
    ),
  },
];

const mapIcons = [
  {
    title: 'Food Level 1: Empty',
    description: 'Map pin color indicates the fridge is empty, has no food.',
    icon: (
      <MapLegendPinLocationIcon
        sx={{ fontSize: 20, color: pinColor.itemsEmpty }}
      />
    ),
  },
  {
    title: 'Food Level 2: Few Items',
    description: 'Map pin color indicates only a few food items are available.',
    icon: (
      <MapLegendPinLocationIcon
        sx={{ fontSize: 20, color: pinColor.itemsFew }}
      />
    ),
  },
  {
    title: 'Food Level 3: Many Items',
    description: 'Map pin color indicates the fridge has many items available.',
    icon: (
      <MapLegendPinLocationIcon
        sx={{ fontSize: 20, color: pinColor.itemsMany }}
      />
    ),
  },
  {
    title: 'Food Level 4: Full',
    description: 'Map pin color indicates the fridge is full.',
    icon: (
      <MapLegendPinLocationIcon
        sx={{ fontSize: 20, color: pinColor.itemsFull }}
      />
    ),
  },
  {
    title: 'Needs Cleaning',
    description: 'Latest report says the fridge needs cleaning.',
    icon: (
      <MapLegendConditionDirtyIcon
        sx={{ fontSize: 20, color: pinColor.fridgeOperation }}
      />
    ),
  },
  {
    title: 'Needs Repairs',
    description: 'Latest report says the fridge is out of order.',
    icon: (
      <MapLegendConditionOutOfOrderIcon
        sx={{ fontSize: 20, color: pinColor.fridgeOperation }}
      />
    ),
  },
  {
    title: 'Not at Location',
    description:
      'The fridge is reported as not currently at that address. This could be temporary (for example: the fridge is being repaired, or organizers are in the process of moving it to a new location)',
    icon: (
      <MapLegendPinNotAtLocationIcon
        sx={{ fontSize: 20, color: pinColor.fridgeNotAtLocation }}
      />
    ),
  },
  {
    title: 'Ghost fridge',
    description:
      'This fridge is permanently unavailable, can toggle it on using our map filters.',
    icon: (
      <MapLegendPinGhostIcon
        sx={{ fontSize: 20, color: pinColor.fridgeGhost }}
      />
    ),
  },
  {
    title: 'No report yet',
    description: 'The fridge has no current status report in the app.',
    icon: (
      <MapLegendPinNoReportIcon
        sx={{ fontSize: 20, color: pinColor.reportUnavailable }}
      />
    ),
  },
];

export default function FaqsPage(): React.ReactElement {
  return (
    <Box
      sx={{
        flexGrow: 1,
        backgroundColor: 'background.default',
        color: 'text.primary',
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>
        <Typography
          variant="h1"
          textAlign="center"
          sx={{
            color: 'text.primary',
            mb: { xs: 8, md: 10 },
            fontSize: { xs: '1.75rem', md: '2rem' },
            fontWeight: 650,
          }}
        >
          Frequently Asked Questions
        </Typography>

        <Box
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: designColor.borderGray,
            maxWidth: { xs: '100%', md: 1100 },
            mx: 'auto',
            backgroundColor: 'background.paper',
          }}
        >
          <Box
            sx={{
              px: { xs: 2.5, md: 4 },
              py: 2,
            }}
          >
            <Typography
              variant="h4"
              sx={{
                color: designColor.blue.interactive,
                fontSize: { xs: '1.15rem', md: '1.25rem' },
              }}
            >
              Using FridgeFinder
            </Typography>
          </Box>

          <FaqAccordion question="How do User Rewards work?">
            <Stack spacing={1.25}>
              {pointRules.map((rule) => (
                <Stack
                  key={rule.action}
                  direction="row"
                  spacing={1.25}
                  sx={{
                    py: 0.5,
                  }}
                >
                  <Box sx={{ color: 'text.primary', display: 'flex' }}>
                    {rule.icon}
                  </Box>
                  <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                    <strong>{rule.action}</strong> = {rule.points} points{' '}
                    {rule.detail}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </FaqAccordion>

          <FaqAccordion question="What are User Types?">
            <Stack spacing={2}>
              <Typography variant="body1" sx={{ lineHeight: 1.75 }}>
                <strong>Neighbor:</strong> Someone who is in community with the
                fridges. Uses FridgeFinder to locate nearby fridges or see
                latest updates
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.75 }}>
                <strong>Volunteer:</strong> A Neighbor who has submitted a
                Fridge Report. Volunteers are the heart of FridgeFinder - they
                help keep the fridge information up to date and accurate for
                everyone in the community.
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.75 }}>
                <strong>Note:</strong> you can see your User Type at the top of
                your profile page.
              </Typography>
            </Stack>
          </FaqAccordion>

          <FaqAccordion question="How do Notifications work?">
            <Stack spacing={2}>
              <Typography variant="body1" sx={{ lineHeight: 1.75 }}>
                <strong>Following a Fridge:</strong> To follow a fridge and
                start receiving notifications, go to a fridge profile page,
                click follow, toggle preferences on or off, and save.
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.75 }}>
                <strong>Default Notifications:</strong> By default users receive
                notifications if a fridge is marked as unavailable (for example:
                Not at Location or Permanently Unavailable).
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.75 }}>
                <strong>Needs Repairs:</strong> Users receive a notification
                when someone marks a fridge as needing repairs.
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.75 }}>
                <strong>Needs Cleaning:</strong> Users receive a notification
                when someone marks a fridge as needing cleaning.
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.75 }}>
                <strong>Out of Food:</strong> Users receive a notification when
                someone marks a fridge food level as empty.
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.75 }}>
                <strong>New Food Added:</strong> Users receive a notification
                when someone marks a fridge food level as few items, many items,
                or full.
              </Typography>
            </Stack>
          </FaqAccordion>

          <FaqAccordion question="What do the Map icons mean?">
            <Stack spacing={1.25}>
              {mapIcons.map((item) => (
                <IconRow
                  key={item.title}
                  icon={item.icon}
                  title={item.title}
                  description={item.description}
                />
              ))}
            </Stack>
          </FaqAccordion>
        </Box>

        <Box
          sx={{
            mt: { xs: 7, md: 8 },
            textAlign: 'center',
            maxWidth: { xs: '100%', md: 1100 },
            mx: 'auto',
          }}
        >
          <Typography
            variant="h5"
            sx={{
              mt: 7,
              mb: 5,
            }}
          >
            Still unsure about something?
          </Typography>

          <ButtonLink
            title="Contact Us"
            to="/contact"
            aria-label="Contact us"
            variant="contained"
            sx={{ fontSize: { xs: '0.90rem', md: '0.95rem' }, px: 8, py: 1.75 }}
          />
        </Box>
      </Container>
    </Box>
  );
}
