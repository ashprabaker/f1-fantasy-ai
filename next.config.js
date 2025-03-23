/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverExternalPackages: ['sharp'],
  },
  images: {
    domains: ['media.formula1.com'],
  }
}

module.exports = nextConfig; 