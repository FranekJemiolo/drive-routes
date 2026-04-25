/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/drive-routes',
  assetPrefix: '/drive-routes',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  },
  turbopack: {} // Enable Turbopack with empty config
}

module.exports = nextConfig
