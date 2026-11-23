import path from "path";
import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Self-contained server bundle for the Docker image; tracing starts at the monorepo root.
  output: "standalone",
  outputFileTracingRoot: path.join(process.cwd(), "../.."),
};

export default withPayload(nextConfig);
