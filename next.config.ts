import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  allowedDevOrigins: ["192.168.0.106", "localhost", "[::1]"],
  serverExternalPackages: ["@prisma/client", "pg"],
};


export default nextConfig;
