'use client';

import React from 'react';
import Image from 'next/image';
import { Box, Button, Typography } from '@mui/material';
import {
  WarningAmberRounded as ErrorIcon,
  TaskAltRounded as SuccessIcon,
} from '@mui/icons-material';
import { ButtonLink } from 'components/ui';

const sxSuccessIcon = { fontSize: '1.1em', verticalAlign: 'top' };
const sxErrorIcon = { fontSize: '1.3em', verticalAlign: 'text-bottom' };

type FeedbackFormType =
  | 'EmailSuccess'
  | 'FridgeStatusSuccess'
  | 'Error'
  | 'CreateFridge';

const displayHeading: Record<FeedbackFormType, React.ReactNode> = Object.freeze(
  {
    EmailSuccess: (
      <>
        Success! <SuccessIcon color="success" sx={sxSuccessIcon} />
      </>
    ),
    FridgeStatusSuccess: (
      <>
        Success! <SuccessIcon color="success" sx={sxSuccessIcon} />
      </>
    ),
    Error: (
      <>
        Error! <ErrorIcon color="error" sx={sxErrorIcon} />
      </>
    ),
    CreateFridge: (
      <>
        Success! <SuccessIcon color="success" sx={sxSuccessIcon} />
      </>
    ),
  }
);

const displayText: Record<FeedbackFormType, string> = Object.freeze({
  EmailSuccess: 'Your email was sent.',
  FridgeStatusSuccess: 'You have successfully submitted a status report!',
  Error: 'Action required. Error processing request.',
  CreateFridge: 'You have successfully added a fridge listing!',
});

const displayImg: Record<
  FeedbackFormType,
  { src: string; width: number; height: number; alt: string }
> = Object.freeze({
  EmailSuccess: {
    src: '/feedback/emailSuccess.svg',
    width: 313,
    height: 280,
    alt: 'Email success image',
  },
  FridgeStatusSuccess: {
    src: '/feedback/happyFridge.svg',
    width: 163,
    height: 245,
    alt: 'Happy fridge image',
  },
  Error: {
    src: '/feedback/emailError.svg',
    width: 163,
    height: 245,
    alt: 'Email error image',
  },
  CreateFridge: {
    src: '/feedback/happyFridge.svg',
    width: 163,
    height: 245,
    alt: 'Happy fridge image',
  },
});

interface FeedbackCardProps {
  form: FeedbackFormType;
  slug?: string;
  onClickRetry?: () => void;
}

export function FeedbackCard({
  form,
  slug = '',
  onClickRetry,
}: FeedbackCardProps): React.ReactElement {
  const displayButton = {
    EmailSuccess: (
      <ButtonLink
        to="/"
        aria-label="Go to Home page"
        variant="contained"
        sx={{ mt: 8, mb: 2, minWidth: 300 }}
        title="BACK TO HOME"
      />
    ),
    FridgeStatusSuccess: (
      <ButtonLink
        to={slug}
        aria-label="View Fridge status"
        variant="contained"
        sx={{ mt: 8, mb: 2, minWidth: 300 }}
        title="GO TO FRIDGE"
      />
    ),
    Error: (
      <Button
        onClick={onClickRetry}
        aria-label="Return to the form and try again"
        variant="contained"
        sx={{ mt: 8, mb: 2, minWidth: 300 }}
      >
        TRY AGAIN
      </Button>
    ),
    CreateFridge: (
      <>
        <ButtonLink
          to="#"
          aria-label="View Fridge status"
          variant="contained"
          sx={{ mt: 8, mb: 2, minWidth: 300 }}
          title="GO TO FRIDGE"
        />
        <ButtonLink
          to="#"
          aria-label="Edit Fridge details"
          variant="outlined"
          sx={{ mb: 2, mt: 6, minWidth: 300 }}
          title="EDIT FRIDGE"
        />
      </>
    ),
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        maxWidth: 600,
        mx: 'auto',
        p: { xs: 4, md: 6 },
        backgroundColor: 'transparent',
      }}
    >
      <Typography textAlign="center" variant="h1" sx={{ mt: 2, mb: 1 }}>
        {displayHeading[form]}
      </Typography>
      <Typography
        textAlign="center"
        variant="body1"
        sx={{ mb: 6, color: 'text.secondary' }}
      >
        {displayText[form]}
      </Typography>
      <Box sx={{ my: 2 }}>
        <Image
          {...displayImg[form]}
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </Box>
      <Box
        sx={{
          mt: 2,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {displayButton[form]}
      </Box>
    </Box>
  );
}
