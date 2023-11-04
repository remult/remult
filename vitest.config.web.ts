import { config } from 'dotenv'
import { defineConfig } from 'vitest/config'

config()

export default defineConfig({
  test: {
    threads: false,

    include: [
      './projects/tests/**/*.spec-browser.ts',
      //'./projects/tests/tests/try-test.spec-browser.ts',
      //'./projects/tests/dbs/sql-lite.spec.ts',
    ],
    //  reporters: ['dot'],
    globals: false,
    browser: {
      name: 'chrome',
      enabled: true,
    },
    // coverage: {
    //   enabled: false,
    //   provider: 'v8',
    //   reporter: ['text', 'json', 'html'],
    //   include: ['**'],
    // },
  },
})
