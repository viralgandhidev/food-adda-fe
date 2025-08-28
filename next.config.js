/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["example.com", "localhost"], // Add your image domains here
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/uploads/**",
      },
    ],
  },
  // Enable static file serving
  output: "standalone",
  // Skip TypeScript checking during build for faster builds
  typescript: {
    ignoreBuildErrors: true,
  },
  // Skip ESLint during build for faster builds
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
