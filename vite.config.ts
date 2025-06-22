import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content/index.ts'),
        popup: resolve(__dirname, 'src/popup/index.html'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: (assetInfo) => {
          // Put popup.html in root, everything else with original names
          if (assetInfo.name === 'index.html' && assetInfo.source?.includes('ShopSpin Settings')) {
            return 'popup.html';
          }
          return '[name].[ext]';
        }
      }
    },
    copyPublicDir: true
  },
  publicDir: 'public'
});