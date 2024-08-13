import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Project root
  build: {
    outDir: 'dist', // Output directory
    assetsDir: 'assets', // Directory for assets
    rollupOptions: {
      input: {
        main: './index.html',
        transfers: './transfers/index.html',
        sales: './sales/index.html',
        difficulties: './difficulties/index.html',
        mortgages: './mortgages/index.html'
      }
    }
  }
});
