/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
  },
  // Enable static file serving
  output: "standalone",
};

module.exports = nextConfig;
