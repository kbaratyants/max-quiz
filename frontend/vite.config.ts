import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['max-quiz.ru'],
    strictPort: true,
    hmr: false, // Отключаем HMR полностью, чтобы избежать проблем с WebSocket
    watch: {
      usePolling: false,
    },
  },
});
