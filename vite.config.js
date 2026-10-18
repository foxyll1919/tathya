import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
//
// Note on secrets: this config reads no environment variables and the
// build needs none. UNSPLASH_ACCESS_KEY is used *only* by the authoring
// script scripts/curate-photos.mjs on the developer's machine — the app
// makes zero Unsplash API calls and hotlinks images.unsplash.com
// directly, so there is nothing for Vercel to configure.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'Tathya',
        short_name: 'Tathya',
        description: 'Tathya (तथ्य) — Personal Wisdom Library',
        theme_color: '#4F46E5',
        background_color: '#FFFFFF',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,png,svg}'],
        // Backdrops come from Unsplash's CDN. Cache-first so the app
        // keeps its backdrop offline after the first view; the CDN
        // already serves a 1-year immutable cache, so this only costs
        // us storage, not freshness.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'unsplash-backdrops',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
    })
  ]
})
