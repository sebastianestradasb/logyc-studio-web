// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Canonical domain: www (the apex redirects here). Keep it in sync with Netlify's domain settings.
export default defineConfig({
  site: 'https://www.logycstudio.com',
  // Emit index.html, en.html, web.html… so every URL from the static version keeps working.
  build: { format: 'file' },
  integrations: [sitemap()],
});
