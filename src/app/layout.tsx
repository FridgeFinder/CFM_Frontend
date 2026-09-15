import * as React from 'react';
import { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Box } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ResponsiveAppBar } from 'features/navigation';
import { Providers } from 'components/shared/Providers';
import { FooterWrapper } from 'components/layout';
import { designColor } from 'theme/palette';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Fridge Finder',
  description:
    'A mobile friendly website that displays an interactive map of all the community fridges in and around New York City.',
};

export const viewport: Viewport = {
  initialScale: 1,
  width: 'device-width',
  themeColor: designColor.blue.light,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        className={inter.className}
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100svh',
          margin: 0,
        }}
      >
        <AppRouterCacheProvider>
          <Providers>
            <ResponsiveAppBar />
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                '& > *': {
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                },
              }}
            >
              {children}
            </Box>
            <FooterWrapper />
          </Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
