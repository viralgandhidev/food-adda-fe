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
};

module.exports = nextConfig;
