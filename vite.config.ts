import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

import { vendorChunkGroups } from './config/vite/vendor-chunks'

const siteBasePath = process.env.VITE_BASE_PATH ?? '/'
const appThemeColor = '#f5f1ec'

// https://vite.dev/config/
export default defineConfig({
  base: siteBasePath,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['**/*'],
      manifest: {
        name: 'Link Deck',
        short_name: 'Link Deck',
        description: 'A local-first start page for saving, grouping, searching, and opening frequently used links.',
        theme_color: appThemeColor,
        background_color: appThemeColor,
        display: 'standalone',
        start_url: siteBasePath,
        scope: siteBasePath,
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['index.html', 'assets/**/*.{js,css,html,ico,png,svg,webmanifest,woff,woff2}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: vendorChunkGroups,
        },
      },
    },
  },
})
