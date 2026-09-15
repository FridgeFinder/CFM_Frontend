'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Box,
  Button,
  Card,
  Divider,
  TextField,
  Typography,
} from '@mui/material';
import { otpSchema, OtpFormData } from '../schemas/auth.schema';
import { designColor } from 'theme/palette';
import { authCardSx, tryAgainButtonSx } from '../auth.styles';

interface PhoneOtpCardProps {
  submittedPhone: string;
  phoneError: string | null;
  isLoading: boolean;
  onVerifyOtp: (code: string) => Promise<boolean>;
  onSuccess: () => void;
  onTryAgain: () => void;
}

export function PhoneOtpCard({
  submittedPhone,
  phoneError,
  isLoading,
  onVerifyOtp,
  onSuccess,
  onTryAgain,
}: PhoneOtpCardProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  });

  const onSubmit = async (data: OtpFormData) => {
    const success = await onVerifyOtp(data.code);
    if (success) onSuccess();
  };

  const handleTryAgain = () => {
    reset();
    onTryAgain();
  };

  return (
    <Box>
      <Card variant="outlined" sx={authCardSx}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            fontWeight={700}
            sx={{ fontSize: { xs: '1.25rem' }, mb: 1 }}
          >
            Enter the verification code
          </Typography>
          <Typography sx={{ fontWeight: 450, fontSize: { xs: '0.95rem' } }}>
            We sent a 6-digit code to{' '}
            <Box component="span" fontWeight={600}>
              {submittedPhone}
            </Box>
          </Typography>
        </Box>

        {phoneError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {phoneError}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}
        >
          <TextField
            type="text"
            placeholder="123456"
            fullWidth
            {...register('code')}
            error={!!errors.code}
            helperText={errors.code?.message}
            disabled={isLoading}
            slotProps={{ htmlInput: { maxLength: 6, inputMode: 'numeric' } }}
            sx={{
              '& .MuiOutlinedInput-root': { borderRadius: 3 },
              '& .MuiInputBase-input': {
                py: '18px',
                px: '16px',
                textAlign: 'center',
                letterSpacing: '0.5em',
                fontSize: '1.25rem',
              },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={isLoading}
            sx={{
              borderRadius: 3,
              py: 2.5,
              fontWeight: 700,
              textTransform: 'none',
            }}
          >
            {isLoading ? 'Verifying…' : 'Verify'}
          </Button>
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
            Didn&apos;t get the code?{' '}
          </Typography>
          <Button
            variant="text"
            onClick={handleTryAgain}
            disableRipple
            sx={tryAgainButtonSx}
          >
            Try again
          </Button>
        </Box>
      </Card>
      <div id="recaptcha-container" />
    </Box>
  );
}
