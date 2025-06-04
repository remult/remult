// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  build: {},
  nitro: {
    preset: 'node',
    esbuild: {
      options: {
        tsconfigRaw: {
          compilerOptions: {
            experimentalDecorators: true,
          },
        },
      },
    },
    rollupConfig: {
      external: (id) => {
        // TMP
        // Exclude the problematic file from transformation
        return id.includes('get-remult-admin-html.js')
      }
    }
  }
})
