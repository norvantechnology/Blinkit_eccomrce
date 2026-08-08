import type { NextConfig } from 'next';

const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api-docs',
        destination: `${backendUrl}/api-docs`,
      },
      {
        source: '/api-docs/:path*',
        destination: `${backendUrl}/api-docs/:path*`,
      },
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
      {
        source: '/health',
        destination: `${backendUrl}/health`,
      },
    ];
  },
};

export default nextConfig;
