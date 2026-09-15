'use client';

import Image from 'next/image';
import { Box, Button, Card, Divider, Typography } from '@mui/material';
import { designColor } from 'theme/palette';
import { authCardSx, subtextSx, tryAgainButtonSx } from '../auth.styles';

interface EmailSentCardProps {
  submittedEmail: string;
  onTryAgain: () => void;
}

export function EmailSentCard({
  submittedEmail,
  onTryAgain,
}: EmailSentCardProps) {
  return (
    <Box>
      <Card variant="outlined" sx={authCardSx}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Image
            src="/feedback/emailSuccess.svg"
            alt="Email sent"
            width={85}
            height={76}
          />
        </Box>

        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            fontWeight={700}
            sx={{ fontSize: { xs: '1.25rem' }, mb: 1 }}
          >
            Check your email to continue
          </Typography>
          <Typography sx={{ fontWeight: 450, fontSize: { xs: '0.95rem' } }}>
            We&apos;ve sent a sign-in link to{' '}
            <Box component="span" fontWeight={600}>
              {submittedEmail}
            </Box>
            . Click the link to continue
          </Typography>
        </Box>

        <Divider
          sx={{
            mx: { xs: -4, sm: -5 },
            my: 3,
            borderColor: designColor.borderSubtle,
          }}
        />

        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography
            component="span"
            sx={{ fontWeight: 500, fontSize: { xs: '0.875rem' } }}
          >
            Didn&apos;t get the email?{' '}
          </Typography>
          <Button
            variant="text"
            onClick={onTryAgain}
            disableRipple
            sx={tryAgainButtonSx}
          >
            Try again
          </Button>
        </Box>
      </Card>

      <Typography sx={subtextSx}>
        Check your spam folder if you don&apos;t see the email in your inbox
      </Typography>
    </Box>
  );
}
