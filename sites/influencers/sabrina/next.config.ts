import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // El paquete compartido se distribuye como TS fuente; Next lo transpila.
  transpilePackages: ["@axs/cms-client"],
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
