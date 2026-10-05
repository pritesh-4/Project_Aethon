import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
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
            if (normalized.includes('/lucide-react/')) {
              return 'vendor-icons';
            }
          }
        },
      },
    },
  },
});
