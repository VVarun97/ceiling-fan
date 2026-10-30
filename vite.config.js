import { defineConfig } from 'vite';

export default defineConfig({
  // Use relative base so assets load correctly on any domain or subdirectory (e.g. GitHub Pages)
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
});
