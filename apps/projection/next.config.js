/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  experimental: {
    // Exclude sql.js from server bundling - it uses WASM which needs special handling
    serverComponentsExternalPackages: ['sql.js'],
  },
}

module.exports = nextConfig
