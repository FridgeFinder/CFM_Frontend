'use client';

import React from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { Alert, Button } from '@mui/material';
import { FridgeReport } from 'types/domain';
import { ReportContainer } from './FridgeInformation';

function ReportSkeleton(): React.ReactElement {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
      <CircularProgress size={24} />
    </Box>
  );
}

export function FridgeReportSection({
  report,
  error,
  onRetry,
}: {
  report: FridgeReport | null | undefined;
  error?: string;
  onRetry: () => void;
}): React.ReactElement {
  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" onClick={onRetry}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }
  if (report === undefined) return <ReportSkeleton />;
  return <ReportContainer report={report} />;
}
