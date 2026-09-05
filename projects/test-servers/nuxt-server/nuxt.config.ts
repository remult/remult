// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  build: {},
  nitro: {
    preset: 'node',
    // vue <-> @vue/server-renderer peer cycle creates nested symlinks
    // in .output; CI then dies with ELOOP on scandir.
    noExternals: true,
    esbuild: {
      options: {
        tsconfigRaw: {
          compilerOptions: {
            experimentalDecorators: true,
          },
        },
      },
    },
  },
})
