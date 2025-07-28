// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  // Use server output to enable API routes and middleware
  output: 'server',
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()]
  },

  adapter: vercel({
    // Enable ISR for static pages with API functionality
    isr: { 
      expiration: 60 * 60, // 1 hour cache for static content
    },
    // Enable Vercel Image Optimization
    imageService: true,
    devImageService: 'sharp',
    imagesConfig: {
      sizes: [16, 32, 48, 64, 96, 128, 192, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
      formats: ['image/avif', 'image/webp'],
      minimumCacheTTL: 60,
      dangerouslyAllowSVG: true,
    },
    // Enable Vercel Web Analytics only in production
    webAnalytics: {
      enabled: process.env.NODE_ENV === 'production'
    }
  })
});