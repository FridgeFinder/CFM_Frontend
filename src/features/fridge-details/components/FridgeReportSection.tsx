'use client';

import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { FridgeReport } from 'types/domain';
import { ReportContainer } from './FridgeInformation';

const baseUrl = `${process.env.NEXT_PUBLIC_FF_API_URL}/v1/fridges/`;

async function getFridgeReport(id: string): Promise<FridgeReport | null> {
  try {
    const response = await fetch(`${baseUrl}${id}/reports`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) return null;

    const reports: FridgeReport[] = await response.json();
    return reports[0] ?? null;
  } catch {
    return null;
  }
}

function ReportSkeleton(): React.ReactElement {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
      <CircularProgress size={24} />
    </Box>
  );
}

export function FridgeReportSection({
  fridgeId,
}: {
  fridgeId: string;
}): React.ReactElement {
  const [report, setReport] = useState<FridgeReport | null | undefined>(
    undefined
  );

  useEffect(() => {
    getFridgeReport(fridgeId).then(setReport);
  }, [fridgeId]);

  if (report === undefined) return <ReportSkeleton />;
  return <ReportContainer report={report} />;
}
