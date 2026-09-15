'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Container,
  TextField,
  Typography,
} from '@mui/material';
import { useAuthStore } from 'store/useAuthStore';
import { signOut } from 'firebase/auth';
import { getFirebaseAuth } from 'config/firebase';
import { designColor } from 'theme/palette';
import { authCardSx } from 'features/auth/auth.styles';
import {
  confirmLinkEmail,
  LINK_EMAIL_RETURN_KEY,
} from 'features/auth/hooks/useLinkEmail';
import { updateUserEmail } from 'features/auth/utils/updateUserEmail';

type PageStatus =
  | 'loading'
  | 'needs-email'
  | 'no-user'
  | 'email-in-use'
  | 'error'
  | 'success';

export default function LinkEmailPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const authStatus = useAuthStore((s) => s.status);

  const [pageStatus, setPageStatus] = useState<PageStatus>('loading');
  const [emailInput, setEmailInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait until auth has resolved before attempting the link
    if (authStatus === 'loading') return;

    async function tryLink() {
      try {
        const email = await confirmLinkEmail();
        await finishLink(email);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === 'no-user') {
          setPageStatus('no-user');
        } else if (msg === 'needs-email') {
          setPageStatus('needs-email');
        } else if (
          (err as { code?: string }).code === 'auth/email-already-in-use'
        ) {
          setPageStatus('email-in-use');
        } else {
          setError(msg);
          setPageStatus('error');
        }
      }
    }

    tryLink();
    // Run once after auth resolves
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus]);

  async function finishLink(email: string) {
    const returnTo = window.localStorage.getItem(LINK_EMAIL_RETURN_KEY) ?? '/';
    window.localStorage.removeItem(LINK_EMAIL_RETURN_KEY);
    const currentUser = useAuthStore.getState().user;
    if (currentUser) {
      await updateUserEmail(currentUser, email);
    }
    setPageStatus('success');
    setTimeout(() => router.replace(returnTo), 1500);
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPageStatus('loading');
    try {
      const email = await confirmLinkEmail(emailInput);
      await finishLink(email);
    } catch (err) {
      if ((err as { code?: string }).code === 'auth/email-already-in-use') {
        setPageStatus('email-in-use');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to link email.');
        setPageStatus('error');
      }
    }
  }

  return (
    <Container maxWidth="xs">
      <Box sx={{ pt: { xs: 12, md: 20 }, pb: { xs: 6, md: 10 } }}>
        {pageStatus === 'loading' && (
          <Box display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        )}

        {pageStatus === 'email-in-use' && (
          <Card variant="outlined" sx={authCardSx}>
            <Typography variant="h5" fontWeight={700} textAlign="center" mb={2}>
              Email already in use
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
              mb={3}
            >
              This email address is already associated with another account.
              Sign out and sign back in with that email, or contact support if
              you need further help.
            </Typography>
            <Button
              variant="contained"
              fullWidth
              onClick={async () => {
                await signOut(getFirebaseAuth());
                router.replace('/auth/signin');
              }}
              sx={{
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 600,
                py: 1.5,
                mb: 1.5,
              }}
            >
              Sign Out
            </Button>
            <Button
              variant="text"
              fullWidth
              href="/contact?subject=Account%20Help%20%E2%80%93%20Email%20Already%20in%20Use"
              sx={{
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 600,
                py: 1.5,
              }}
            >
              Contact support
            </Button>
          </Card>
        )}

        {pageStatus === 'no-user' && (
          <Card variant="outlined" sx={authCardSx}>
            <Typography variant="h5" fontWeight={700} textAlign="center" mb={2}>
              Sign in first
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
              mb={3}
            >
              You need to be signed in on this device to link your email. Please
              sign in first, then click the verification link in your email
              again.
            </Typography>
            <Button
              variant="contained"
              fullWidth
              onClick={() => router.replace('/auth/signin')}
              sx={{
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 600,
                py: 1.5,
              }}
            >
              Go to Sign In
            </Button>
          </Card>
        )}

        {(pageStatus === 'needs-email' || pageStatus === 'error') && (
          <Card variant="outlined" sx={authCardSx}>
            <Typography variant="h5" fontWeight={700} textAlign="center" mb={1}>
              Confirm your email
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
              mb={3}
            >
              Enter the email address you used to request the verification link.
            </Typography>
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
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
                autoFocus
                fullWidth
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  py: 1.5,
                }}
              >
                Verify email
              </Button>
            </Box>
          </Card>
        )}

        {pageStatus === 'success' && (
          <Card variant="outlined" sx={authCardSx}>
            <Typography variant="h5" fontWeight={700} textAlign="center" mb={1}>
              Email linked!
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
              sx={{ color: designColor.mutedText }}
            >
              Your email has been verified and added to your account.
              Redirecting you back…
            </Typography>
          </Card>
        )}
      </Box>
    </Container>
  );
}
