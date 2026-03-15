import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  webpack: (config) => {
    // Fix pdfjs-dist canvas issue
    config.resolve.alias.canvas = false;
    
    // Allow .mjs worker files
    config.module.rules.push({
      test: /pdf\.worker\.mjs$/,
      type: "asset/resource",
    });

    return config;
  },
};

export default nextConfig;