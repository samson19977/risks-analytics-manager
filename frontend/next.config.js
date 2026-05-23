/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: '',
  },
  // No rewrites needed — all /api/* routes are handled by Next.js API route handlers
  // Auth:      src/app/api/auth/login & me
  // Portfolio: src/app/api/portfolio/*
  // Branches:  src/app/api/branches
  // Alerts:    src/app/api/alerts/*
  // Analytics: src/app/api/analytics/*
  // Reports:   src/app/api/reports/*
  // Clients:   src/app/api/clients
}

module.exports = nextConfig
