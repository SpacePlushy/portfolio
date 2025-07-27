// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()]
  },

  adapter: vercel({
    // Use static output for better performance
    // Static pages are served from edge globally
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