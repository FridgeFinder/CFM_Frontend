import React from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { AppStatus } from 'types/domain';

interface StateBoundaryProps {
  status: AppStatus;
  children: React.ReactNode;
  loadingView?: React.ReactNode;
  errorView?: React.ReactNode;
  emptyView?: React.ReactNode;
  error?: string | null;
  onRetry?: () => void;
}

export function StateBoundary({
  status,
  children,
  loadingView,
  errorView,
  emptyView,
  error,
  onRetry,
}: StateBoundaryProps): React.ReactElement | null {
  if (status === 'loading') {
    return (
      <Box>
        {loadingView || (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}
      </Box>
    );
  }

  if (status === 'error') {
    return (
      (errorView as React.ReactElement) || (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            Oops! Something went wrong.
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            {error || 'An unexpected error occurred.'}
          </Typography>
          {onRetry && (
            <Button variant="outlined" onClick={onRetry}>
              Try Again
            </Button>
          )}
        </Box>
      )
    );
  }

  if (status === 'empty') {
    return (
      (emptyView as React.ReactElement) || (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            No items found.
          </Typography>
        </Box>
      )
    );
  }

  if (status === 'idle') {
    return null;
  }

  return <>{children}</>;
}
