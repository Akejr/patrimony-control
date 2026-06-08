/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Caminho base no GitHub Pages: https://<user>.github.io/patrimony-control/
const BASE = '/patrimony-control/';

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  // Em produção (build) usa o subcaminho do GitHub Pages; em dev usa a raiz.
  const base = command === 'build' ? BASE : '/';

  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: [
          'favicon.svg',
          'favicon-32x32.png',
          'apple-touch-icon.png',
          'apple-touch-icon-180x180.png',
        ],
        manifest: {
          name: 'Patrimony Control',
          short_name: 'Patrimony',
          description: 'Controle de patrimônio pessoal local-first',
          lang: 'pt',
          display: 'standalone',
          orientation: 'portrait',
          start_url: base,
          scope: base,
          background_color: '#ffffff',
          theme_color: '#ffffff',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-512x512-maskable.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: 'apple-touch-icon-180x180.png',
              sizes: '180x180',
              type: 'image/png',
              purpose: 'any',
            },
          ],
        },
        workbox: {
          // Precache do app shell para carregamento offline (Req. 7.2).
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          navigateFallback: `${base}index.html`,
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    test: {
      globals: true,
      environment: 'jsdom',
    },
  };
});
