import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "sodium-native": "sodium-javascript",
    };
    return config;
  },
  turbopack: {
    resolveAlias: {
      "sodium-native": "sodium-javascript",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*", // Allow images from all domains
      },
    ],
  },
};

export default nextConfig;
