import type { NextConfig } from "next";

const lanHosts = (process.env.ALLOWED_DEV_ORIGINS || "192.168.1.104")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["localhost", "127.0.0.1", ...lanHosts],
  async rewrites() {
    const backend = process.env.BACKEND_URL || "http://127.0.0.1:3000";
    return [{ source: "/backend/:path*", destination: `${backend}/:path*` }];
  },
};

export default nextConfig;
