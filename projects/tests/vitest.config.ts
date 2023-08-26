import { defineConfig } from 'vitest/config'
import { config } from 'dotenv'
config()

export default defineConfig({
  test: {
    threads: true,

    include: [
      '*.spec.ts',
      '../core/src/**/*.spec.ts',
      // '../core/src/**/**/*.backend-spec.ts',
    ],
    globals: false,
  },
})
