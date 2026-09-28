import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// Cloudflare beacon injected only for production builds.
const cfBeacon = `<!-- Cloudflare Web Analytics --><script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "519b97ca534c48e6aff6d6298a48187f", "spa": false}'></script><!-- End Cloudflare Web Analytics -->`;

export default defineConfig(({ mode }) => ({
  base: '/tusp/',
  plugins: [
    preact(),
    {
      name: 'inject-cf-beacon',
      transformIndexHtml(html) {
        if (mode === 'production') {
          return html.replace('<!--CF_BEACON-->', cfBeacon);
        }
        return html.replace('<!--CF_BEACON-->', '');
      },
    },
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 0,
  },
  test: undefined as unknown as undefined,
}));
