declare module '@ducanh2912/next-pwa' {
  import type { NextConfig } from 'next';

  export interface PWAOptions {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
    buildExcludes?: string[];
    [key: string]: unknown;
  }

  const withPWA: (options?: PWAOptions) => (nextConfig: NextConfig) => NextConfig;
  export default withPWA;
}
