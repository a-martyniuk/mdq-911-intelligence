import type { NextConfig } from "next";

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://unpkg.com https://cdn.plot.ly;
  style-src 'self' 'unsafe-inline' https://unpkg.com https://fonts.googleapis.com;
  img-src 'self' blob: data: https://*.tile.openstreetmap.org https://unpkg.com;
  font-src 'self' https://fonts.gstatic.com data:;
  connect-src 'self' https://*.tile.openstreetmap.org https://unpkg.com;
  frame-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'self';
  upgrade-insecure-requests;
`.replace(/\s{2,}/g, " ").trim();

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: cspHeader,
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  basePath: "/mdq-911-intelligence",
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
