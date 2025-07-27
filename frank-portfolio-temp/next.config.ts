import type { NextConfig } from "next";
import { withBotId } from 'botid/next/config';

const nextConfig: NextConfig = {
  // Allow local subdomain testing
  async headers() {
    const headers = [];
    
    // Production static asset caching
    if (process.env.NODE_ENV === 'production') {
      headers.push({
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      });
      
      // Cache fonts
      headers.push({
        source: '/:all*(woff|woff2|ttf|otf)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      });
      
      // Cache CSS and JS with shorter cache for updates
      headers.push({
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      });
    }
    
    // Development headers
    if (process.env.NODE_ENV === 'development') {
      headers.push({
        source: '/:path*',
        headers: [{
          key: 'x-custom-header',
          value: 'local-development',
        }],
      });
    }
    
    return headers;
  },
  // Ensure images work properly
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
  // Optimize production builds
  poweredByHeader: false,
  compress: true,
  // Generate standalone output for better performance
  output: 'standalone',
};

export default withBotId(nextConfig);
