'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CircularProgress,
  Container,
  TextField,
  Button,
  Alert,
  Typography,
} from '@mui/material';
import { useEmailAuth, SIGN_IN_RETURN_KEY } from 'features/auth';
import { designColor } from 'theme/palette';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { confirmSignIn, status, error } = useEmailAuth();
  const [needsEmail, setNeedsEmail] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  useEffect(() => {
    const trySignIn = async () => {
      const result = await confirmSignIn();
      if (result === 'success') {
        const returnTo = window.localStorage.getItem(SIGN_IN_RETURN_KEY) ?? '/';
        window.localStorage.removeItem(SIGN_IN_RETURN_KEY);
        router.replace(returnTo);
      } else if (result === 'needs-email') {
        setNeedsEmail(true);
      }
      // 'error': error state is set in the hook, rendered below
    };

    trySignIn();
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEmailSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const success = await confirmSignIn(emailInput);
    if (success === 'success') {
      const returnTo = window.localStorage.getItem(SIGN_IN_RETURN_KEY) ?? '/';
      window.localStorage.removeItem(SIGN_IN_RETURN_KEY);
      router.replace(returnTo);
    }
  };

  if (needsEmail) {
    return (
      <Container maxWidth="xs">
        <Box sx={{ pt: { xs: 12, md: 20 }, pb: { xs: 6, md: 10 } }}>
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
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h4">Confirm your email</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                We couldn&apos;t retrieve your email automatically. Please enter
                the email address you used to request the sign-in link.
              </Typography>
            </Box>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Box
              component="form"
              onSubmit={handleEmailSubmit}
              sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              <TextField
                label="Email address"
                type="email"
                autoComplete="email"
                fullWidth
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                disabled={status === 'loading'}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={status === 'loading' || !emailInput}
              >
                {status === 'loading' ? 'Signing in…' : 'Confirm'}
              </Button>
            </Box>
          </Card>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xs">
        <Box sx={{ mt: 8 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    </Container>
  );
}
