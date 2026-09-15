import React from 'react';
import { Metadata } from 'next';
import { Typography } from '@mui/material';
import { SplitFeatureLayout } from 'components/layout';

export const metadata: Metadata = {
  title: 'Fridge Finder: Service fridges',
};

export default function ServiceFridgesPage(): React.ReactElement {
  return (
    <SplitFeatureLayout
      title="Taking care of fridges"
      image={{
        src: '/hero/service_fridges.webp',
        alt: 'Man inspecting fridge',
      }}
      action={{
        title: 'Service Fridges',
        to: '/contact?subject=Fridge%20Service%20Interest',
        'aria-label': 'Interested in fixing and maintaining a fridge',
      }}
    >
      <Typography
        variant="body1"
        paragraph
        sx={{
          lineHeight: 1.7,
          mb: 2,
          fontSize: '1.125rem',
          color: 'text.secondary',
        }}
      >
        Fridges should be cleaned daily. If you see trash at a fridge location,
        take the trash with you to dispose of it properly. If the fridge is in
        need of a repair, you can alert our community on Fridge Finder by
        submitting a status report for that fridge.
      </Typography>
      <Typography
        variant="body1"
        paragraph
        sx={{
          lineHeight: 1.7,
          mb: 2,
          fontSize: '1.125rem',
          color: 'text.secondary',
        }}
      >
        Do you have repair skills that can fix broken refrigerators? Can you
        help build fridge shelters? Contact us.
      </Typography>
    </SplitFeatureLayout>
  );
}
