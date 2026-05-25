import type { NextConfig } from 'next';

/**
 * Next.js configuration for Apex Dashboard.
 *
 * Vercel Serverless function settings (memory and timeout) are configured
 * in vercel.json:
 *   - Function memory: >= 512 MB
 *   - Function timeout: >= 30 seconds
 *
 * These cannot be set in next.config.ts directly; they require vercel.json.
 */
const nextConfig: NextConfig = {
  // Ensure Prisma client is not bundled into the serverless function bundle.
  // Instead, it is loaded as an external package at runtime, which is required
  // for the binary engine to resolve correctly in Vercel's Lambda environment.
  // Requirement 13.6
  serverExternalPackages: ['@prisma/client', 'prisma'],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
};

export default nextConfig;
