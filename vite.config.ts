import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  const enablePwa = env.VITE_ENABLE_PWA !== 'false';
  const isElectron = mode === 'electron' || !!process.env.ELECTRON;

  return {
    plugins: [
      react(),
      // Electron plugins — only active when building for desktop
      isElectron &&
        electron([
          {
            // Main process entry point
            entry: 'electron/main.ts',
            onstart(args) {
              args.startup();
            },
            vite: {
              build: {
                outDir: 'dist-electron',
                sourcemap: true,
                rollupOptions: {
                  external: [
                    'electron',
                    'electron-store',
                    'electron-updater',
                    'nodemailer',
                  ],
                },
              },
            },
          },
          {
            // Preload script
            entry: 'electron/preload.ts',
            onstart(args) {
              args.reload();
            },
            vite: {
              build: {
                outDir: 'dist-electron',
                sourcemap: true,
                rollupOptions: {
                  external: ['electron'],
                },
              },
            },
          },
        ]),
      isElectron && renderer(),
      // PWA — only for web builds, not Electron
      !isElectron &&
        enablePwa &&
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
          manifest: {
            name: 'PC Prebuild Spec Card Generator',
            short_name: 'Spec Cards',
            description: 'Generate print-ready PDF spec cards for prebuilt computers',
            theme_color: '#3b82f6',
            background_color: '#f3f4f6',
            display: 'standalone',
            orientation: 'portrait',
            scope: '/',
            start_url: '/',
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
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                },
              },
              {
                urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'gstatic-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                },
              },
            ],
          },
        }),
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@stores': path.resolve(__dirname, './src/stores'),
        '@lib': path.resolve(__dirname, './src/lib'),
        '@config': path.resolve(__dirname, './src/config'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@types': path.resolve(__dirname, './src/types'),
      },
    },
    define: {
      __APP_VERSION__: JSON.stringify(env.npm_package_version || '1.0.0'),
    },
    server: {
      port: 5173,
      open: !isElectron, // Don't auto-open browser when running in Electron
    },
    build: {
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            // Core React - loaded immediately
            react: ['react'],
            'react-dom': ['react-dom'],
            // PDF generation - lazy loaded on export
            'pdf-generator': ['jspdf'],
            // QR code library
            qrcode: ['qrcode'],
            // Barcode library
            jsbarcode: ['jsbarcode'],
            // State management
            zustand: ['zustand'],
          },
        },
      },
    },
  };
});
