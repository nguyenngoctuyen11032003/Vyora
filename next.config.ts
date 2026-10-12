import type { NextConfig } from "next";

// Static export for GitHub Pages (spec §2). NEXT_PUBLIC_BASE_PATH is '' locally and
// '/Vyora' in CI; it is inlined at build time (see src/lib/env.ts `asset()` for <img>).
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

const nextConfig: NextConfig = {
  output: "export",
  basePath: basePath || undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
