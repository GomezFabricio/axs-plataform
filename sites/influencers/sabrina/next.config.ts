import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Self-contained server bundle for the Docker image; tracing starts at the monorepo root.
  output: "standalone",
  outputFileTracingRoot: path.join(process.cwd(), "../../.."),
  // El paquete compartido se distribuye como TS fuente; Next lo transpila.
  transpilePackages: ["@axs/cms-client"],
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
