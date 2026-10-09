import type { NextConfig } from "next";
import os from "os";
import path from "path";

function isLanIpv4(addr: os.NetworkInterfaceInfo): boolean {
  return addr.family === "IPv4" && !addr.internal;
}

/** Hosts that may open the Next.js dev server (phones on Wi-Fi, Bonjour, tunnels). */
function householdDevOrigins(): string[] {
  const hosts = new Set<string>(["*.trycloudflare.com", "*.local"]);
  const raw = process.env.AUTH_URL;
  if (raw) {
    try {
      const host = new URL(raw).hostname;
      if (host) hosts.add(host);
    } catch {
      // ignore invalid AUTH_URL
    }
  }
  for (const addrs of Object.values(os.networkInterfaces())) {
    for (const addr of addrs ?? []) {
      if (isLanIpv4(addr)) hosts.add(addr.address);
    }
  }
  return [...hosts];
}

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
  devIndicators: false,
  // Phone / LAN access: AUTH_URL host and current LAN IPs must be allowed or RSC/login fetches fail
  allowedDevOrigins: householdDevOrigins(),
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
