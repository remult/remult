import type { Plugin } from 'vite'
import { transform } from './transform'

export type RemultViteOptions = {
  debug?: boolean
}

/**
 * Add this vite plugin in your vite.config.ts as first one.
 * 
 * It should look like this:
 * ```ts
  import { sveltekit } from "@sveltejs/kit/vite";
  import { defineConfig } from "vite";
  import { remult } from "remult/vite";  // 👈
  
  export default defineConfig({
    plugins: [
      remult(),                           // 👈
      sveltekit()
    ],
  });
 * ```
 * 
 */
export function remult(options?: RemultViteOptions): Plugin {
  return {
    name: 'vite:remult',
    enforce: 'pre',

    transform: async (code, filepath, option) => {
      // Don't transform server-side code
      if (option?.ssr) {
        return
      }
      // remult files are only in ts
      if (!filepath.endsWith('.ts')) {
        return
      }

      const { transformed, ...rest } = await transform(code)

      if (options?.debug && transformed) {
        console.log(`
----- Remult after transform of ${filepath}
${rest.code}
----- 
`)
      }

      return rest
    },
  }
}
