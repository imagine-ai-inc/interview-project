import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mastra and better-sqlite3 load native modules the bundler cannot bundle.
  serverExternalPackages: ["@mastra/*", "better-sqlite3"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
