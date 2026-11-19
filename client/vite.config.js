import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

const backendTarget = process.env.VITE_BACKEND_URL || 'http://localhost:3000';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: backendTarget,
        secure: false,
      },
      '/uploads': {
        target: backendTarget,
        secure: false,
      },
      '/socket.io': {
        target: backendTarget,
        ws: true,
        secure: false,
      },
    },
  },
  plugins: [react()],
});
