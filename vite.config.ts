import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Hosted Deployment Configuration Guard (CICD-002)
const isHostedProductionCheck =
  process.env.REQUIRE_HOSTED_API_CONFIG === 'true' ||
  (process.env.VERCEL_ENV === 'production' && process.env.ENFORCE_PROD_CONFIG === 'true');

if (isHostedProductionCheck) {
  const apiUrl = process.env.VITE_API_BASE_URL?.trim();
  if (!apiUrl || apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')) {
    throw new Error(
      `[AETHON Config Error] Hosted production build requires an explicit non-localhost VITE_API_BASE_URL. Provided: "${apiUrl || '<unset>'}". Configure VITE_API_BASE_URL in your hosting environment settings.`
    );
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          const normalized = id.replace(/\\/g, '/');
          if (normalized.includes('/node_modules/')) {
            if (
              normalized.includes('/react/') ||
              normalized.includes('/react-dom/') ||
              normalized.includes('/react-router/')
            ) {
              return 'vendor-react';
            }
            if (
              normalized.includes('/recharts/') ||
              normalized.includes('/d3-') ||
              normalized.includes('/victory-vendor/')
            ) {
              return 'vendor-charts';
            }
            if (normalized.includes('/motion/')) {
              return 'vendor-motion';
            }
            if (normalized.includes('/three/')) {
              return 'vendor-three';
            }
            if (normalized.includes('/lucide-react/')) {
              return 'vendor-icons';
            }
          }
        },
      },
    },
  },
});
