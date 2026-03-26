/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['simple-git', 'playwright', 'better-sqlite3'],
  },
};

module.exports = nextConfig;
