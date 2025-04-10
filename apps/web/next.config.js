/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@flattr/ui"],
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