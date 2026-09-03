import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } from 'next/constants.js';
import i18nConfig from './next-i18next.config.js';
import { fileURLToPath } from 'node:url';
import { createJiti } from 'jiti';
const jiti = createJiti(fileURLToPath(import.meta.url));
import withSerwistInit from '@serwist/next';

/** @type {typeof import('./src/utils/env')} */
const envUtils = await jiti.import('./src/utils/env');
const { parseEnvBoolean } = envUtils;

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await jiti.import('./src/env');

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: parseEnvBoolean(process.env.DOCKER_OUTPUT) ? 'standalone' : undefined,
  transpilePackages: ['@t3-oss/env-nextjs', '@t3-oss/env-core'],
  /**
   * If you are using `appDir` then you must comment the below `i18n` config out.
   *
   * @see https://github.com/vercel/next.js/issues/41980
   */
  i18n: i18nConfig.i18n,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  /**
   * Custom fork: proxy the separate `splitpro-stats` service under `/stats` so it shares the
   * origin (and therefore the NextAuth session cookie). Resolved at build time.
   *
   * No `locale: false` here: with i18n, Next matches user rewrites against the internally
   * localised path (`/default/stats`), so the source must carry the automatic locale prefix.
   */
  async rewrites() {
    const statsUrl = process.env.STATS_INTERNAL_URL ?? 'http://splitpro-stats:3100';

    return [
      {
        source: '/stats/:path*',
        destination: `${statsUrl}/stats/:path*`,
      },
    ];
  },
};

const withSerwist = withSerwistInit({
  swSrc: 'worker/index.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development', // Incompatible with Turbopack https://github.com/serwist/serwist/issues/54
});

export default withSerwist(nextConfig);
