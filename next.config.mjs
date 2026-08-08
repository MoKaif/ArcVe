/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.igdb.com',
        pathname: '/igdb/image/upload/**',
      },
      {
        // Cover fallback for Steam titles IGDB has no artwork for.
        protocol: 'https',
        hostname: 'cdn.cloudflare.steamstatic.com',
        pathname: '/steam/apps/**',
      },
      {
        // Profile avatar on the "now playing" banner.
        protocol: 'https',
        hostname: 'avatars.steamstatic.com',
        pathname: '/**',
      },
    ],
  },
  output: 'standalone',
}

export default nextConfig
