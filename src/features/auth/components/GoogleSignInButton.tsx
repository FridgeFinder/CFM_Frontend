'use client';

import { Alert, Button } from '@mui/material';
import { GoogleIcon } from 'theme/icons';
import { designColor } from 'theme/palette';
import { useGoogleAuth } from '../hooks/useGoogleAuth';

export function GoogleSignInButton() {
  const { signInWithGoogle, status, error } = useGoogleAuth();

  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Button
        variant="outlined"
        color="inherit"
        fullWidth
        size="large"
        onClick={signInWithGoogle}
        disabled={status === 'loading'}
        startIcon={<GoogleIcon />}
        sx={{
          borderRadius: 3,
          py: 2.5,
          fontWeight: 600,
          textTransform: 'none',
          bgcolor: designColor.white,
          color: designColor.neroGray,
          border: `1px solid ${designColor.lightSilver} !important`,
          '&:hover': {
            bgcolor: 'rgba(0,0,0,0.02)',
            border: `1px solid ${designColor.magneticGray} !important`,
          },
          '&.Mui-disabled': {
            bgcolor: designColor.white,
            color: designColor.neroGray,
            border: `1px solid ${designColor.lightSilver} !important`,
          },
          '&.Mui-focusVisible, &:focus': {
            outline: 'none',
            boxShadow: '0 0 0 3px rgba(0,0,0,0.12)',
            border: `1px solid ${designColor.lightSilver} !important`,
          },
        }}
      >
        {status === 'loading' ? 'Signing in…' : 'Continue with Google'}
      </Button>
    </>
  );
}
