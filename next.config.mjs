/**
 * Next.js configuration for Apex Dashboard.
 *
 * Vercel Serverless function settings (memory and timeout) are configured
 * in vercel.json:
 *   - Function memory: >= 512 MB
 *   - Function timeout: >= 30 seconds
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure Prisma client is not bundled into the serverless function bundle.
  // Required for the binary engine to resolve correctly in Vercel's Lambda environment.
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
