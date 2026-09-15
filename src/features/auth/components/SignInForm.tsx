'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Box,
  Button,
  Card,
  Divider,
  MenuItem,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Link as MuiLink,
} from '@mui/material';
import { NextLink } from 'components/ui';
import {
  emailSchema,
  EmailFormData,
  phoneSchema,
  PhoneFormData,
} from '../schemas/auth.schema';
import { useEmailAuth } from '../hooks/useEmailAuth';
import { usePhoneAuth } from '../hooks/usePhoneAuth';
import { useAuthStore } from 'store/useAuthStore';
import { designColor, applyAlpha } from 'theme/palette';
import { EmailSentCard } from './EmailSentCard';
import { GoogleSignInButton } from './GoogleSignInButton';
import { PhoneOtpCard } from './PhoneOtpCard';
import { subtextSx } from '../auth.styles';

export function SignInForm({
  onSuccess,
  returnPath,
}: {
  onSuccess?: () => void;
  returnPath?: string;
} = {}) {
  const router = useRouter();
  const authStatus = useAuthStore((s) => s.status);
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const [signInType, setSignInType] = useState<'email' | 'phone'>('email');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [submittedPhone, setSubmittedPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+1');

  const {
    sendSignInLink,
    reset: emailReset,
    status: emailStatus,
    error: emailError,
  } = useEmailAuth();
  const {
    sendOtp,
    verifyOtp,
    reset: phoneReset,
    status: phoneStatus,
    error: phoneError,
    otpSent,
  } = usePhoneAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });
  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
  });
  const phoneDigits = (phoneForm.watch('phone') ?? '').replace(
    /\D/g,
    ''
  ).length;

  useEffect(() => {
    if (authStatus === 'authenticated') {
      if (onSuccessRef.current) {
        onSuccessRef.current();
      } else {
        router.replace('/');
      }
    }
    // onSuccess is intentionally excluded — read via ref to avoid re-firing on re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus, router]);

  const resetForm = () => {
    emailReset();
    phoneReset();
    setSubmittedEmail('');
    setSubmittedPhone('');
    setSignInType('email');
  };

  const onSubmit = async (data: EmailFormData) => {
    setSubmittedEmail(data.email);
    await sendSignInLink(data.email, returnPath);
  };

  const onSubmitPhone = async (data: PhoneFormData) => {
    const e164 = `${countryCode}${data.phone}`;
    setSubmittedPhone(e164);
    await sendOtp(e164, 'recaptcha-container');
  };

  if (emailStatus === 'success') {
    return (
      <EmailSentCard submittedEmail={submittedEmail} onTryAgain={resetForm} />
    );
  }

  if (signInType === 'phone' && otpSent) {
    return (
      <PhoneOtpCard
        submittedPhone={submittedPhone}
        phoneError={phoneError}
        isLoading={phoneStatus === 'loading'}
        onVerifyOtp={verifyOtp}
        onSuccess={() => {
          if (onSuccessRef.current) onSuccessRef.current();
          else router.replace('/');
        }}
        onTryAgain={phoneReset}
      />
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography
          component="h1"
          fontWeight={750}
          sx={{ fontSize: { xs: '2.25rem', md: '3rem' }, lineHeight: 1.4 }}
        >
          Welcome!
        </Typography>
        <Typography
          variant="body1"
          sx={{ fontSize: { xs: '1rem', md: '1.125rem' } }}
          fontWeight={500}
        >
          Start getting{' '}
          <Box component="span" fontWeight={750} sx={{ color: 'primary.main' }}>
            notified
          </Box>{' '}
          when your local fridges are{' '}
          <Box component="span" fontWeight={750} sx={{ color: 'primary.main' }}>
            stocked
          </Box>
          ,{' '}
          <Box component="span" fontWeight={750} sx={{ color: 'primary.main' }}>
            need support
          </Box>
          , or are{' '}
          <Box component="span" fontWeight={750} sx={{ color: 'primary.main' }}>
            moved
          </Box>
        </Typography>
      </Box>

      {/* Card */}
      <Card
        variant="outlined"
        sx={{
          borderRadius: 4,
          py: { xs: 8, sm: 9 },
          px: { xs: 7, sm: 7 },
          mx: { xs: 2 },
          borderColor: designColor.borderSubtle,
        }}
      >
        <Box
          component="form"
          onSubmit={
            signInType === 'email'
              ? handleSubmit(onSubmit)
              : phoneForm.handleSubmit(onSubmitPhone)
          }
          noValidate
          sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}
        >
          {/* Toggle */}
          <Box>
            <Typography
              variant="body2"
              fontWeight={550}
              sx={{ mb: 2, fontSize: '0.95rem' }}
            >
              Sign in with
            </Typography>
            <ToggleButtonGroup
              value={signInType}
              exclusive
              onChange={(_, val) => {
                if (val) {
                  if (val === 'email') phoneReset();
                  else emailReset();
                  setSignInType(val);
                }
              }}
              fullWidth
              sx={{
                bgcolor: designColor.whiteSmoke,
                borderRadius: 10,
                p: 1,
                '& .MuiToggleButtonGroup-grouped': {
                  border: 0,
                  borderRadius: '20px !important',
                  fontSize: 14,
                  py: 2,
                  textTransform: 'none',
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.main' },
                  },
                },
              }}
            >
              <ToggleButton value="email" disableRipple>
                Email
              </ToggleButton>
              <ToggleButton value="phone" disableRipple>
                Phone
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Input */}
          <Box>
            <Typography
              variant="body2"
              fontWeight={550}
              sx={{ mb: 2, fontSize: '0.95rem' }}
            >
              {signInType === 'email' ? 'Email Address' : 'Phone Number'}
            </Typography>
            {signInType === 'email' ? (
              <TextField
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                fullWidth
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
                disabled={emailStatus === 'loading'}
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: 3 },
                  '& .MuiInputBase-input': { py: '18px', px: '16px' },
                }}
              />
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  disabled={phoneStatus === 'loading'}
                  sx={{
                    borderRadius: 3,
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    flexShrink: 0,
                    '& .MuiSelect-select': { py: '18px', px: '14px' },
                  }}
                >
                  <MenuItem value="+1">+1</MenuItem>
                </Select>
                <TextField
                  type="tel"
                  autoComplete="tel"
                  placeholder="(555) 123-4567"
                  fullWidth
                  {...phoneForm.register('phone', {
                    onChange: (e) => {
                      e.target.value = e.target.value.replace(/\D/g, '');
                    },
                  })}
                  error={!!phoneForm.formState.errors.phone}
                  helperText={phoneForm.formState.errors.phone?.message}
                  disabled={phoneStatus === 'loading'}
                  sx={{
                    '& .MuiOutlinedInput-root': { borderRadius: 3 },
                    '& .MuiInputBase-input': { py: '18px', px: '16px' },
                  }}
                />
              </Box>
            )}
          </Box>

          {signInType === 'email' && emailError && (
            <Alert severity="error">{emailError}</Alert>
          )}
          {signInType === 'phone' && phoneError && (
            <Alert severity="error">{phoneError}</Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            // phoneDigits !== 10 is US/Canada-specific — update if other country codes are added
            disabled={
              emailStatus === 'loading' ||
              phoneStatus === 'loading' ||
              (signInType === 'phone' && phoneDigits !== 10)
            }
            sx={{
              borderRadius: 3,
              py: 2.5,
              fontWeight: 700,
              textTransform: 'none',
              '&.Mui-disabled': {
                bgcolor: designColor.blue.disabled,
                color: '#fff',
              },
            }}
          >
            {emailStatus === 'loading' || phoneStatus === 'loading'
              ? 'Sending…'
              : 'Continue'}
          </Button>
        </Box>

        {/* Divider */}
        <Divider
          sx={{
            my: 3.5,
            '&::before, &::after': {
              borderColor: applyAlpha('47', designColor.dividerMuted),
            },
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: designColor.dividerMuted }}
          >
            OR
          </Typography>
        </Divider>

        {/* Google button */}
        <GoogleSignInButton />
      </Card>

      {/* Subtext */}
      <Typography sx={subtextSx}>
        By continuing, you agree to our User Agreement and acknowledge that you
        understand the{' '}
        <MuiLink component={NextLink} href="/privacy" underline="hover">
          Privacy Policy
        </MuiLink>
        .
      </Typography>
      <div id="recaptcha-container" />
    </Box>
  );
}
