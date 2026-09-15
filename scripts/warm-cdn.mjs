#!/usr/bin/env node

import { performance } from 'node:perf_hooks';

const baseUrl = process.env.WARM_BASE_URL;

if (!baseUrl) {
  console.error('Missing WARM_BASE_URL. Example:');
  console.error(
    'WARM_BASE_URL="https://u2-jp.d1zqbru9k8x5eq.amplifyapp.com" yarn warm:cdn'
  );
  process.exit(1);
}

const routes = [
  '/',
  '/contact',
  '/browse',
  '/pamphlet/about',
  '/pamphlet/best-practices',
  '/pamphlet/get-involved',
  '/profile',
];

function sanitizeBaseUrl(url) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

async function hit(url) {
  const start = performance.now();
  const response = await fetch(url, {
    method: 'GET',
  });
  const end = performance.now();

  return {
    status: response.status,
    durationMs: Math.round(end - start),
    xCache: response.headers.get('x-cache') || '-',
    xNextjsCache: response.headers.get('x-nextjs-cache') || '-',
    cacheControl: response.headers.get('cache-control') || '-',
  };
}

async function warmRoute(base, route) {
  const url = `${base}${route}`;

  const first = await hit(url);
  const second = await hit(url);

  return { route, first, second };
}

async function main() {
  const base = sanitizeBaseUrl(baseUrl);

  console.log(`Warming CDN for ${base}`);
  console.log('');

  for (const route of routes) {
    const result = await warmRoute(base, route);
    console.log(`Route: ${result.route}`);
    console.log(
      `  first : status=${result.first.status} time=${result.first.durationMs}ms x-cache="${result.first.xCache}" next-cache="${result.first.xNextjsCache}"`
    );
    console.log(
      `  second: status=${result.second.status} time=${result.second.durationMs}ms x-cache="${result.second.xCache}" next-cache="${result.second.xNextjsCache}"`
    );
    console.log(`  cache-control: ${result.second.cacheControl}`);
    console.log('');
  }
}

main().catch((error) => {
  console.error('Warmup failed:', error);
  process.exit(1);
});
