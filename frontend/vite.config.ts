import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['max-quiz.ru'],
    strictPort: true,
    // Отключаем HMR для работы через внешний домен (max-quiz.ru)
    // Это предотвращает ошибки WebSocket при доступе не с localhost
    hmr: false,
    watch: {
      usePolling: true,
    },
  },
});

