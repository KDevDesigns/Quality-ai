import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  // The dev script binds 127.0.0.1; allow both loopback names so either URL hydrates.
  // `npm run lan:dev` also needs this machine's LAN address or name, listed in LAN_ORIGINS.
  allowedDevOrigins: ["127.0.0.1", "localhost", ...(process.env.LAN_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean)],
  cacheComponents: true,
  partialPrefetching: true,
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
