import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import { spawn, type ChildProcess } from 'node:child_process'
import http from 'node:http'
import path from 'node:path'

function checkBackendListening(port = 8000, host = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.request(
      {
        host,
        port,
        path: '/up',
        method: 'GET',
        timeout: 600,
      },
      (res) => {
        resolve(res.statusCode !== undefined)
      }
    )
    req.on('error', () => resolve(false))
    req.on('timeout', () => {
      req.destroy()
      resolve(false)
    })
    req.end()
  })
}

function laravelBackendPlugin(): Plugin {
  let backendProc: ChildProcess | null = null

  const cleanup = () => {
    if (backendProc && backendProc.pid) {
      if (process.platform === 'win32') {
        try {
          spawn('taskkill', ['/pid', backendProc.pid.toString(), '/T', '/F'])
        } catch {}
      } else {
        backendProc.kill()
      }
      backendProc = null
    }
  }

  return {
    name: 'vite-plugin-laravel-backend',
    async configureServer(server) {
      const isUp = await checkBackendListening(8000)
      if (!isUp) {
        const rootDir = process.cwd()
        const backendDir = path.resolve(rootDir, 'backend')
        console.log('\x1b[36m[vite-laravel]\x1b[0m Starting Laravel backend on http://127.0.0.1:8000...')

        backendProc = spawn('php', ['artisan', 'serve', '--host=127.0.0.1', '--port=8000'], {
          cwd: backendDir,
          stdio: 'inherit',
          shell: process.platform === 'win32',
        })

        backendProc.on('exit', (code) => {
          if (code !== 0 && code !== null) {
            console.error(`\x1b[31m[vite-laravel]\x1b[0m Backend stopped with code ${code}`)
          }
          backendProc = null
        })

        process.on('exit', cleanup)
        process.on('SIGINT', cleanup)
        process.on('SIGTERM', cleanup)
      } else {
        console.log('\x1b[32m[vite-laravel]\x1b[0m Backend is already running on port 8000.')
      }

      server.httpServer?.on('close', cleanup)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    laravelBackendPlugin(),
  ],
  server: {
    host: true,
    hmr: {
      host: 'localhost',
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            console.error(`[vite-proxy] Proxy error connecting to backend: ${err.message} (${req.url})`);
            if (res && 'writeHead' in res && !('headersSent' in res && res.headersSent)) {
              res.writeHead(502, {
                'Content-Type': 'application/json',
              });
              res.end(JSON.stringify({
                message: 'Backend server is unreachable (502 Bad Gateway). Please verify that the Laravel backend is running on http://127.0.0.1:8000.',
                code: 'BACKEND_UNAVAILABLE',
              }));
            }
          });
        },
      },
    },
  },
})
