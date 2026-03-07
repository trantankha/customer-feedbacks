import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Docker optimization - standalone output for efficient containerization
  output: 'standalone',
};

export default nextConfig;
