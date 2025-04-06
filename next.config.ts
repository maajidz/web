import type { NextConfig } from "next";

// Read allowed origins from environment variable, split by comma, default to empty array
const allowedDevOriginsEnv = process.env.NEXT_PUBLIC_ALLOWED_DEV_ORIGINS || '';
const allowedDevOriginsArray = allowedDevOriginsEnv.split(',').filter(Boolean);

console.log('Allowed Dev Origins for HMR:', allowedDevOriginsArray); // Log loaded origins

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ hostname: 'public.readdy.ai' }],
  },
  // Allow connections from specific origins during development for HMR
  allowedDevOrigins: allowedDevOriginsArray.length > 0 ? allowedDevOriginsArray : undefined,
};

export default nextConfig;