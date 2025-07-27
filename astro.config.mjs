// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()]
  },

  adapter: vercel({
    // Enable ISR for better performance
    isr: {
      // Cache pages for 1 hour after first request
      expiration: 60 * 60,
    },
    // Enable Vercel Image Optimization
    imageService: true,
    devImageService: 'sharp',
  })
});