/** @type {import('next').NextConfig} */

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_USERS_API_URL',
  'NEXT_PUBLIC_NOTIFICATIONS_API_URL',
];

// Skip env checks during test runs — tests set env vars themselves via isolateModules.
if (process.env.NODE_ENV !== 'test') {
  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}

const nextConfig = {
  reactStrictMode: true,
  // Ensure Next.js tree-shakes MUI barrel imports on the server.
  // Without this, importing one MUI component can pull in the entire package.
  experimental: {
    optimizePackageImports: [
      '@mui/material',
      '@mui/icons-material',
      '@mui/material-nextjs',
    ],
  },
  // Prevent client-only SDKs from being bundled into the Lambda server bundle.
  // Instead Node.js requires them from node_modules at runtime, removing them
  // from the server bundle parse phase → faster cold starts.
  //   firebase  (~220KB) — auth SDK, only used in AuthProvider ('use client')
  //   zod       (~136KB) — form schemas, only used in react-hook-form components
  //   zustand            — client state stores, only used in 'use client' hooks
  serverExternalPackages: [
    'firebase',
    '@firebase/app',
    '@firebase/auth',
    'zod',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'community-fridge-map-images-prod.s3.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'community-fridge-map-images-dev.s3.amazonaws.com',
        pathname: '/**',
      },
    ],
  },
  compiler: {
    emotion: true,
  },
  async rewrites() {
    // Determine the API URL from the environment or default to local json-server
    const apiUrl =
      process.env.NEXT_PUBLIC_FF_API_URL || 'http://127.0.0.1:3050';
    return [
      {
        source: '/v1/:path*',
        destination: `${apiUrl}/v1/:path*`, // Proxy to Backend API or local mock server
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/user/fridge/report/:fridgeId',
        destination: '/fridge/:fridgeId/report',
        permanent: true, // HTTP 301 redirect for SEO preservation
      },
    ];
  },
  async headers() {
    return [
      {
        // Apply stale-while-revalidate to all static page routes.
        // Excludes /fridge/* (managed by Next.js ISR revalidate: 3600) and
        // /_next/* (static assets already have immutable cache headers).
        source: '/((?!fridge|_next|api).*)',
        headers: [
          {
            key: 'Cache-Control',
            // s-maxage=86400: tells CloudFront (and other CDNs) to cache for 24h.
            // max-age=0: browser always revalidates with CloudFront (gets fast 304).
            // stale-while-revalidate=86400: after 24h, CloudFront serves stale while
            // revalidating in background — giving a 48h total cold-start-free window.
            // Content only changes on deploy; the CDN warmup script forces a fresh
            // cache after each push so users never see stale post-deploy content.
            value:
              'public, s-maxage=86400, max-age=0, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
