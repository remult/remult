import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import express from 'vite3-plugin-express'

export default defineConfig({
  plugins: [react(), express('src/server')],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
