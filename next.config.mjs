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
  // Next.js 14.x uses experimental.serverComponentsExternalPackages
  // (renamed to serverExternalPackages in Next.js 15+)
  // Ensures Prisma's binary engine resolves correctly in Vercel's Lambda environment.
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },

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
