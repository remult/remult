import { config } from 'dotenv'
import { defineConfig } from 'vitest/config'

config()

export default defineConfig({
  test: {
    threads: false,

    include: [
      //   './projects/tests/tests/try-test.spec.ts',
      './projects/tests/**/*.spec.ts',
      './projects/tests/**/*.backend-spec.ts',
      './projects/tests/dbs/sql-lite.spec.ts',
    ],
    reporters: ['default', 'junit'],
    outputFile: './test-results.xml',
    globals: false,
    coverage: {
      enabled: false,
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['projects/core/**'],
    },
  },
})
