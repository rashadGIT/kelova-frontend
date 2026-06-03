import type { NextConfig } from 'next';
import path from 'path';
import { withSentryConfig } from '@sentry/nextjs';

if (
  process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true' &&
  process.env.NODE_ENV === 'production'
) {
  throw new Error(
    'FATAL: NEXT_PUBLIC_DEV_AUTH_BYPASS must not be true in a production build. Aborting.',
  );
}

const nextConfig: NextConfig = {
  transpilePackages: ['@kelova/shared-types'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    typedRoutes: false,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },
};

export default withSentryConfig(nextConfig, {
  // Sentry org/project — populated from CI env vars during deploy
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Upload source maps only in CI; skip locally to keep dev fast
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: { disable: false },
  disableLogger: true,
  // Don't block build if Sentry DSN is missing (e.g. local dev without .env)
  telemetry: false,
});
