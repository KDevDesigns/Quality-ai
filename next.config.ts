import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
    // Ticket forms post up to 6 images of 10 MB each. proxy.ts runs on those requests and would otherwise
    // cut the buffered body off at 10 MB without an error.
    serverActions: { bodySizeLimit: "64mb" },
    proxyClientMaxBodySize: "64mb",
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
