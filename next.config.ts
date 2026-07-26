import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["*.trycloudflare.com"],
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
      },
    ],
  },
  experimental: {
    // Required for video uploads through middleware/proxy (default 10MB truncates body)
    proxyClientMaxBodySize: "500mb",
    serverActions: {
      bodySizeLimit: "500mb",
    },
  },
  // Dev uses --webpack (see scripts/dev.sh); production build uses Turbopack
  turbopack: {},
  // Webpack dev: ignore local media folders (prevents hang when storage/ has many files)
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          path.join(process.cwd(), "storage"),
          path.join(process.cwd(), "backups"),
          path.join(process.cwd(), "exports"),
        ],
      };
    }
    return config;
  },
};

export default nextConfig;
