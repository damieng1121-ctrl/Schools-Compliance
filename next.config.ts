import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a minimal, self-contained server bundle (.next/standalone) —
  // needed for a lean Docker image that doesn't ship the full node_modules.
  output: "standalone",
};

export default nextConfig;
