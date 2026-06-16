import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
  turbopack: {
    resolveAlias: {
      // pdfjs-dist references 'canvas' in its Node.js path — mock it for browser bundle
      canvas: "./src/lib/canvas-mock.js",
    },
  },
};

export default nextConfig;
