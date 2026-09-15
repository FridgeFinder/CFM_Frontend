'use client';

import React from 'react';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            fontFamily: 'sans-serif',
            textAlign: 'center',
            padding: '20px',
          }}
        >
          <h1 style={{ color: '#d32f2f', marginBottom: '16px' }}>
            Fatal Error Occurred
          </h1>
          <p style={{ marginBottom: '32px', color: '#666' }}>
            We encountered a critical application error.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: '10px 24px',
              backgroundColor: '#0056b3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
