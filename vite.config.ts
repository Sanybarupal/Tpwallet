import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'disable-preview-hmr-client',
        enforce: 'post',
        transformIndexHtml(html) {
          // Vite may inject the client with different attribute ordering or
          // an absolute path. The preview proxy has no HMR WebSocket endpoint.
          return html.replace(/<script\b[^>]*src=["'][^"']*\@vite\/client[^"']*["'][^>]*><\/script>/gi, '');
        },
      },
    ],
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
