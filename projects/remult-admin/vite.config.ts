import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import express from 'vite3-plugin-express'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), viteSingleFile(), , express('src/server/')],

  define: {
    __DEV__: process.env.DEV === 'true',
  },
  build: {
    outDir: 'tmp',
  },
})
