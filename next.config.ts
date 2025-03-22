import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.formula1.com',
        pathname: '/**',
      },
      // Allow F1 driver images from other potential domains
      {
        protocol: 'https',
        hostname: 'www.formula1.com',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
