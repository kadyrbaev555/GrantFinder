import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

const repoRoot = fileURLToPath(new URL('../', import.meta.url))

export default defineConfig(({ mode }) => {
  const { API_PORT = '8080' } = loadEnv(mode, repoRoot, 'API_PORT')
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/health': `http://127.0.0.1:${API_PORT}`,
      },
    },
  }
})
