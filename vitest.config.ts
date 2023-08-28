import { config } from 'dotenv'
import { defineConfig } from 'vitest/config'
config()

export default defineConfig({
  test: {
    threads: false,

    include: [
      './projects/tests/**/*.spec.ts',

      './projects/tests/**/*.backend-spec.ts',
    ],
    //  reporters: ['dot'],
    globals: false,
    coverage: {
      enabled: false,
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['**'],
    },
  },
})
