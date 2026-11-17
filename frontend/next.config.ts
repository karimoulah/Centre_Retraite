import { withPayload } from '@payloadcms/next/withPayload';
import type { NextConfig } from 'next';

// Payload owns /api. The browser calls /backend/* and Next forwards it to the NestJS API
// (API_URL includes the API's global prefix, e.g. http://localhost:3000/api).
const apiUrl = process.env.API_URL ?? 'http://localhost:3000/api';

const nextConfig: NextConfig = {
  images: {
    localPatterns: [{ pathname: '/api/media/file/**' }],
  },
  async rewrites() {
    return [{ source: '/backend/:path*', destination: `${apiUrl}/:path*` }];
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    };
    return webpackConfig;
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
