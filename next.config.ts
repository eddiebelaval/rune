import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingIncludes: {
    '/api/converse': ['./src/mind/**/*'],
  },
};

export default nextConfig;
