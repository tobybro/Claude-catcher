/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['simple-git', 'playwright'],
  },
};

module.exports = nextConfig;
