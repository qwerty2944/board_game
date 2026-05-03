import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@board-game/shared"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
