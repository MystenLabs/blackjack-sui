/** @type {import('next').NextConfig} */

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  webpack: webpackConfig => {
    webpackConfig.resolve.extensionAlias = {
      // This is a workaround to fix issue with loading files with SWC (Next.js) compiler
      // https://github.com/vercel/next.js/discussions/32237
      '.js': ['.ts', '.js'],
    }

    return webpackConfig
  },
};

module.exports = withPWA(nextConfig);