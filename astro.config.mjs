import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // The deploy workflow sets these from the GitHub Pages settings, so the same build works at
  // brainseal.com/ and at the brainseal.github.io/brainseal-website/ preview address.
  // Pages reports http:// until "Enforce HTTPS" is on; the site is always served over https.
  site: (process.env.SITE_ORIGIN || 'https://brainseal.com').replace(/^http:/, 'https:'),
  base: process.env.BASE_PATH || '/',
  integrations: [sitemap()],
});
