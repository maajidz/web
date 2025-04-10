/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow CSS imports from the UI package and other dependencies
  transpilePackages: ['@flattr/ui', 'jwt-decode'],
  typescript: {
    // Only ignore TypeScript errors in production as a last resort
    // A better approach is to fix the types with declaration files
    ignoreBuildErrors: false,
  },
  // Configure headers if needed
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  async rewrites() {
    // Always redirect API calls to production API
    return [
      {
        source: "/api/:path*",
        destination: `https://api.flattr.io/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [{ hostname: 'public.readdy.ai' }],
  },
  env: {
    // Force API URL to production, regardless of environment
    NEXT_PUBLIC_BACKEND_API_URL: 'https://api.flattr.io'
  }
};

module.exports = nextConfig; 