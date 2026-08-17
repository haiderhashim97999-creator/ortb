import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.100.2", "localhost"],
  
  // Docker standalone output
  output: "standalone",

  // Production security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options",           value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options",     value: "nosniff" },
          { key: "X-XSS-Protection",           value: "1; mode=block" },
          { key: "Referrer-Policy",            value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",         value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      // CORS for ad tags and public API
      {
        source: "/api/(tag|ads-txt|sellers.json|pbjs)(.*)",
        headers: [
          { key: "Access-Control-Allow-Origin",  value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
        ],
      },
    ];
  },

  // Compression
  compress: true,

  // Image optimisation placeholder
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
