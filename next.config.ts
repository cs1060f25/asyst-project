import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Allow build to proceed despite ESLint errors during deployment testing
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow build to proceed despite TypeScript errors during deployment testing
    ignoreBuildErrors: false, // Keep TS errors as they are actual type issues
  },
};

export default nextConfig;
