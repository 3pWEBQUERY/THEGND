import type { NextConfig } from "next";

const s3Host = (() => {
  try {
    return process.env.S3_PUBLIC_URL ? new URL(process.env.S3_PUBLIC_URL).hostname : undefined;
  } catch {
    return undefined;
  }
})();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**.railway.app" },
      { protocol: "https", hostname: "**.up.railway.app" },
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.storageapi.dev" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      ...(s3Host ? [{ protocol: "https" as const, hostname: s3Host }] : []),
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(self)" },
          { key: "X-Robots-Tag", value: "index, follow, max-image-preview:large" },
        ],
      },
    ];
  },
};

export default nextConfig;
