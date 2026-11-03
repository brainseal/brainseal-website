import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // The deploy workflow sets these from the GitHub Pages settings, so the same build works at
  // brainseal.com/ and at the brainseal.github.io/brainseal-website/ preview address.
  site: process.env.SITE_ORIGIN || 'https://brainseal.com',
  base: process.env.BASE_PATH || '/',
  integrations: [sitemap()],
});
