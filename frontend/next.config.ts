import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    // This repo has a root-level lockfile plus `frontend/package-lock.json`.
    // Point Turbopack at the monorepo root to avoid incorrect workspace inference warnings.
    root: path.join(process.cwd(), ".."),
  },
};

export default nextConfig;
