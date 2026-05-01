import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://backend:3000',
        secure: false,
      },
      '/socket.io': {
        target: 'http://backend:3000',
        ws: true,
        secure: false,
      },
    },
    hmr: {
      host: 'localhost',
      clientPort: 5173,
    },
    watch: {
      usePolling: true,
    },
  },
  plugins: [react()],
});
