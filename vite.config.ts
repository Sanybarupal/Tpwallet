import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // The preview proxy does not expose Vite's HMR WebSocket endpoint.
      // Disable client HMR injection so the browser cannot retry a socket
      // that will always close before opening.
      hmr: false,
      watch: null,
    },
  };
});
