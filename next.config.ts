import type { NextConfig } from "next";

const crossOrigin = process.env.NEXT_PUBLIC_CORS_ORIGIN || "https://ledxia.com/servicio";
const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;