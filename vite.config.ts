import { defineConfig } from 'vite'

// Use dynamic import to avoid CommonJS/ESM loading errors when @vitejs/plugin-react is ESM-only
export default defineConfig(async () => {
  const react = (await import('@vitejs/plugin-react')).default
  return {
    plugins: [react()],
    server: {
      port: 5174, // Different port from Rio project
      proxy: {
        '/api': {
          // TODO: Update with actual São Paulo ITBI data endpoint
          target: 'https://placeholder-sp-data-source.sp.gov.br',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '/api/itbi'),
          secure: false
        }
      }
    }
  }
})
