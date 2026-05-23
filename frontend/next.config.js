/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // All /api/* routes handled by Next.js API route handlers — direct Supabase queries
  // Auth:         src/app/api/auth/login & me
  // Portfolio:    src/app/api/portfolio/*
  // Branches:     src/app/api/branches
  // Alerts:       src/app/api/alerts/*
  // Analytics:    src/app/api/analytics/*
  // Reports:      src/app/api/reports/*
  // Clients:      src/app/api/clients
  // Fraud:        src/app/api/fraud/*
  // Stress Test:  src/app/api/stress-test/*
  // AI Insights:  src/app/api/ai/*
}

module.exports = nextConfig
