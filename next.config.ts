import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

// Parse S3 public URL for Next.js Image hostname
const s3RemotePattern = (() => {
  const raw = process.env.NEXT_PUBLIC_S3_URL || process.env.S3_ENDPOINT || "";
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return {
      protocol: u.protocol.replace(":", "") as "http" | "https",
      hostname: u.hostname,
      pathname: "/**",
    };
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner', 'sharp'],
  images: {
    remotePatterns: [
      // S3 / Railway Object Storage
      ...(s3RemotePattern ? [s3RemotePattern] : []),
      // Legacy UploadThing CDN (for existing images already in DB)
      {
        protocol: "https",
        hostname: "utfs.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.ufs.sh",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ufs.sh",
        pathname: "/**",
      },
    ],
  },
  eslint: {
    // Verhindert Build-Abbruch durch ESLint-Plugin-Probleme
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      // Locale prefix rewrites: map /:locale/... to non-localized routes
      {
        source: "/:locale(de|en|fr|it|es|pt|nl|pl|cs|hu|ro)",
        destination: "/",
      },
      {
        source: "/:locale(de|en|fr|it|es|pt|nl|pl|cs|hu|ro)/:path*",
        destination: "/:path*",
      },
      // Existing rewrite: escorts pretty slug
      {
        source: "/escorts/:id-:slug",
        destination: "/escorts/:id/:slug",
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/forum',
        destination: '/community',
        permanent: true,
      },
      {
        source: '/forum/:path*',
        destination: '/community',
        permanent: true,
      },
      {
        source: '/groups',
        destination: '/community',
        permanent: true,
      },
      {
        source: '/groups/:path*',
        destination: '/community',
        permanent: true,
      },
    ];
  },
};

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
})(nextConfig);
