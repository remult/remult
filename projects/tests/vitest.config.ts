import { defineConfig } from 'vitest/config'
import { config } from 'dotenv'

config()

export default defineConfig({
  test: {
    threads: false,

    include: [
      '*.spec.ts',
      //'../core/src/**/*.spec.ts',
      //'../core/src/**/**/*.backend-spec.ts',
    ],
    reporters: ['html', 'dot'],
    globals: false,
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['**'],
    },
  },
})
