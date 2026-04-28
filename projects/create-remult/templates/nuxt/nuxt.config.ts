// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  css: ["/styles.css"],
  compatibilityDate: "2024-04-03",
  devtools: { enabled: true },
  dir: { modules: ".nuxt-modules" },
  nitro: {
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
  vite: {
    esbuild: {
      tsconfigRaw: {
        compilerOptions: {
          experimentalDecorators: true,
        },
      },
    },
  },
});
