import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: 'electron/main.ts'
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: 'electron/preload.ts'
      }
    }
  },
  renderer: {
    root: '.',
    plugins: [
      react(),
      viteStaticCopy({
        targets: [
          {
            src: path.resolve(__dirname, '../../packages/shared/assets/*'),
            dest: 'assets'
          }
        ]
      })
    ],
    build: {
      rollupOptions: {
        input: path.resolve(__dirname, 'index.html')
      }
    },
    resolve: {
      alias: {
        '@neon-survivor/shared': path.resolve(__dirname, '../../packages/shared')
      }
    }
  }
});
