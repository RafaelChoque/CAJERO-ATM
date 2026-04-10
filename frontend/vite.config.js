import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
    ],
    define: {
        global: 'window',
    },
    server: {
        host: true,
        allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app'],
        proxy: {
            '/api': {
                target: 'http://localhost:8083',
                changeOrigin: true,
                secure: false
            },
            '/ws-atm': {
                target: 'http://localhost:8083',
                ws: true,
                changeOrigin: true
            }
        }
    },
    preview: {
        host: true,
        allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app'],
        proxy: {
            '/api': {
                target: 'http://localhost:8083',
                changeOrigin: true,
                secure: false
            }
        }
    }
})