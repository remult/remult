import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    viteSingleFile(),
    visualizer({
      filename: 'stats.json',
      template: 'raw-data',
      gzipSize: true,
      brotliSize: true,
      emitFile: false,
    }) as any,
    {
      name: 'local-express',
      configureServer: async (server: any) => {
        server.middlewares.use(async (req: any, res: any, next: any) => {
          process.env['VITE'] = 'true'
          try {
            const { app } = await server.ssrLoadModule('./src/server')
            app(req, res, next)
          } catch (err) {
            console.error(err)
          }
        })
      },
    },
  ],

  define: {
    __DEV__: process.env.DEV === 'true',
  },
  build: {
    outDir: 'tmp',
  },
})
