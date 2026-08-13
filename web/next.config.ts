import type { NextConfig } from "next";

const isServerBuild = process.env.NEXT_SERVER_BUILD === "1";

const nextConfig: NextConfig = isServerBuild
  ? {}
  : {
      output: "export",
      trailingSlash: true,
    };

export default nextConfig;
