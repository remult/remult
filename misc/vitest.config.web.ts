/// <reference types="@vitest/browser/providers/webdriverio" />
import { config } from 'dotenv'
import { defineConfig } from 'vitest/config'

config()

process.env['IGNORE_GLOBAL_REMULT_IN_TESTS'] = 'true'

const ci = !!process.env.CI

export default defineConfig({
  test: {
    include: ['./projects/tests/**/*.spec-browser.ts'],
    reporters: ['default', 'junit'],
    outputFile: './test-results.xml',
    globals: false,
    setupFiles: ['./projects/tests/browser-setup.ts'],
    coverage: {
      enabled: false,
      provider: 'istanbul',
      reporter: ['json', 'html'],
      include: ['projects/core/**'],
    },
    browser: {
      enabled: true,
      provider: 'webdriverio',
      headless: ci,
      instances: [
        {
          browser: 'chrome',
          ...(ci
            ? {
                capabilities: {
                  'goog:chromeOptions': {
                    args: ['--no-sandbox', '--disable-dev-shm-usage'],
                  },
                },
              }
            : {}),
        },
      ],
    },
  },
})
