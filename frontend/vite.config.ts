import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['max-quiz.ru'],
    strictPort: true,
    hmr: {
      host: 'max-quiz.ru',  // куда браузер реально может достучаться
      protocol: 'wss',      // если страница открыта по https
      clientPort: 443,      // порт, который видит браузер (обычно 443 на https)
    },
    watch: {
      usePolling: true,
    },
  },
});
