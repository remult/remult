import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import express from './run-express.js'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), express('src/backend')],
})
