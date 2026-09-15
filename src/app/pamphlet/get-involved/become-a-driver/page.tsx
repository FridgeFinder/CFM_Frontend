import React from 'react';
import { Metadata } from 'next';
import { Typography } from '@mui/material';
import { SplitFeatureLayout } from 'components/layout';

export const metadata: Metadata = {
  title: 'Fridge Finder: Become a Driver',
};

export default function BecomeADriverPage(): React.ReactElement {
  return (
    <SplitFeatureLayout
      title="Become a Driver"
      image={{
        src: '/hero/become_a_driver.webp',
        alt: 'Food carrier picking up lunch bags',
      }}
      imagePosition="right"
      action={{
        title: 'Become a Driver',
        to: '/contact?subject=Transport%20Food',
        'aria-label': 'Become a Driver',
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
        Volunteer drivers have the capacity to support many fridges at once by
        transporting food to multiple locations. These driving routes are often
        coordinated between fridge organizers, food donors, and drivers. If you
        have access to a bike or vehicle, you can rescue food and feed people in
        need. The impact is immediate!
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
        Anyone is welcome to coordinate these efforts on their own, but if you
        would like to request our driver support, contact Fridge Finder.
      </Typography>
    </SplitFeatureLayout>
  );
}
