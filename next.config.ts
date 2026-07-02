import type { NextConfig } from "next";

const crossOrigin = process.env.NEXT_PUBLIC_CORS_ORIGIN || "https://ledxia.com/servicio";
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Access-Control-Allow-Origin", value: crossOrigin },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
    ];
  }
};

export default nextConfig;