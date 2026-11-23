import adapter from '@sveltejs/adapter-static'
import { sveltekit } from '@sveltejs/kit/vite'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vitest/config'

const REGEX_SEP = /[/\\]/

export default defineConfig({
  plugins: [
    sveltekit({
      compilerOptions: {
        runes: ({ filename }) =>
          filename.split(REGEX_SEP).includes('node_modules') ? undefined : true,
      },
      adapter: adapter(),
      // base path is only known at runtime (rootPath), so routing lives in the hash
      router: { type: 'hash' },
      output: { bundleStrategy: 'inline' },
    }),
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
  test: {
    // a DOM environment makes vitest compile/resolve svelte for the client, where $effect runs
    environment: 'happy-dom',
    include: ['src/**/*.spec.ts'],
  },
})
