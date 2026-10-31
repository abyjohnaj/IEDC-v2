import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Build-time security guard: runs on EVERY build command regardless of mode
  if (command === 'build') {
    if (env.VITE_ENABLE_DEMO !== 'false') {
      throw new Error(
        `\n[SECURITY VIOLATION] Build aborted!\n` +
        `VITE_ENABLE_DEMO must be explicitly set to 'false' during builds.\n` +
        `Current value: '${env.VITE_ENABLE_DEMO}'\n`
      );
    }
  }

  const securityHeaders = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };

  return {
    plugins: [react()],
    build: {
      sourcemap: true,
    },
    server: {
      port: 3000,
      open: false,
      headers: securityHeaders,
    },
    preview: {
      port: 5000,
      headers: securityHeaders,
    }
  };
});
