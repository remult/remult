// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  build: {},
  nitro: {
    preset: 'node',
    // Inline vue so Nitro does not trace vue <-> @vue/server-renderer
    // into circular .output symlinks (ELOOP on CI scandir).
    // Keep remult external: noExternals pulls get-remult-admin-html.js
    // into Rollup, which cannot parse the inlined admin bundle.
    externals: {
      inline: [
        'vue',
        '@vue/server-renderer',
        '@vue/compiler-core',
        '@vue/compiler-dom',
        '@vue/runtime-core',
        '@vue/runtime-dom',
        '@vue/shared',
        '@vue/reactivity',
      ],
      external: ['remult'],
    },
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
