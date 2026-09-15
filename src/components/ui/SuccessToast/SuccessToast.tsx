'use client';
import { Alert, Snackbar } from '@mui/material';
import { designColor } from 'theme/palette';

interface SuccessToastProps {
  open: boolean;
  onClose: () => void;
  message: string;
  duration?: number;
}

export function SuccessToast({
  open,
  onClose,
  message,
  duration = 3000,
}: SuccessToastProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ mb: { xs: 2, md: 0 } }}
    >
      <Alert
        severity="success"
        sx={{
          fontSize: '0.875rem',
          py: 0.5,
          borderRadius: 3,
          bgcolor: 'background.paper',
          border: `1px solid ${designColor.blue.shadowSubtle}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          color: designColor.neroGray,
          '& .MuiAlert-icon': {
            color: designColor.blue.dark,
            fontSize: 16,
            alignItems: 'center',
          },
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
