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
          target: 'https://7qrc3rfl2f226uqohfpkus4hzu0faves.lambda-url.us-west-2.on.aws',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          secure: false
        }
      }
    }
  }
})
