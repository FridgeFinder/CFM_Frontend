'use client';

import * as React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from 'theme';
import { AnalyticsProvider } from './AnalyticsProvider';
import { AuthProvider } from './AuthProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider />
      <React.Suspense fallback={null}>
        <AnalyticsProvider />
      </React.Suspense>
      {children}
    </ThemeProvider>
  );
}
