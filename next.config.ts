import type { NextConfig } from "next";

const nextConfig: any = {
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
      allowedOrigins: ['localhost:3000', '192.168.1.151:3000'],
    },
  },
  allowedDevOrigins: ['192.168.1.151'],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
