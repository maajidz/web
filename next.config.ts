import type { NextConfig } from "next";

// Read allowed origins from environment variable, split by comma, default to empty array
const allowedDevOriginsEnv = process.env.NEXT_PUBLIC_ALLOWED_DEV_ORIGINS || '';
const allowedDevOriginsArray = allowedDevOriginsEnv.split(',').filter(Boolean);

console.log('Allowed Dev Origins for HMR:', allowedDevOriginsArray); // Log loaded origins

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ hostname: 'public.readdy.ai' }],
  },
  // Move allowedDevOrigins to the correct location
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Only apply in development and for client-side
      config.devServer = {
        ...config.devServer,
        // Allow connections from specific origins for HMR
        allowedHosts: allowedDevOriginsArray,
      };
    }
    return config;
  },
};

export default nextConfig;