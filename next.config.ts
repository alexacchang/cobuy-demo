import type { NextConfig } from "next";

// NEXT_DIST_DIR lets several dev servers run side by side during development.
const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
