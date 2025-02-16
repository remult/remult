import { config } from 'dotenv'
import { defineConfig } from 'vitest/config'

config()

export default defineConfig({
  test: {
    threads: false,
    fileParallelism: false,

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
      reporter: ['json', 'html'],
      include: ['projects/core/**'],
    },
  },
})

process.env['IGNORE_GLOBAL_REMULT_IN_TESTS'] = true
