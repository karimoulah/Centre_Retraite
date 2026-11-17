import type { NextConfig } from 'next';

// NestJS serves its routes under /api, which Payload also needs.
// The browser calls /backend/* and Next forwards it to the NestJS API.
const apiUrl = process.env.API_URL ?? 'http://localhost:3000';

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: '/backend/:path*', destination: `${apiUrl}/api/:path*` }];
  },
};

export default nextConfig;
