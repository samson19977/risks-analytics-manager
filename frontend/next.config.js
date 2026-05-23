/** @type {import('next').NextConfig} */
const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: '',  // empty = use relative URLs → Next.js handles routing
  },
  async rewrites() {
    return [
      // Auth is handled by Next.js API routes (no backend needed)
      // /api/auth/login and /api/auth/me are served by src/app/api/auth/*/route.js

      // All other /api/* calls proxy to the Python backend
      {
        source: '/api/:path((?!auth).*)',
        destination: `${BACKEND}/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
