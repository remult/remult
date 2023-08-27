import { defineConfig } from 'vitest/config'
import { config } from 'dotenv'
config()

export default defineConfig({
  test: {
    threads: false,

    include: [
      './projects/tests/**/*.spec.ts',
      
      //'./projects/core/src/**/**/*.backend-spec.ts',
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
