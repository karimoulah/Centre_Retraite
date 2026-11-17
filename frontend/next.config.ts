import { withPayload } from '@payloadcms/next/withPayload';
import type { NextConfig } from 'next';

// NestJS serves its routes under /api, which Payload also needs.
// The browser calls /backend/* and Next forwards it to the NestJS API.
const apiUrl = process.env.API_URL ?? 'http://localhost:3000';

const nextConfig: NextConfig = {
  images: {
    localPatterns: [{ pathname: '/api/media/file/**' }],
  },
  async rewrites() {
    return [{ source: '/backend/:path*', destination: `${apiUrl}/api/:path*` }];
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
