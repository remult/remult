import { defineWorkspace } from 'vitest/config'
import { config } from 'dotenv'
config()

export default defineWorkspace([
  {
    test: {
      threads: false,
      include: [
        '*.spec.ts',
        '../core/src/**/*.spec.ts',
        // '../core/src/**/**/*.backend-spec.ts',
      ],
      globals: false,
    },
  },
  {
    test: {
      threads: false,
      include: ['*.browser-spec.ts', '../core/src/**/*.browser-spec.ts'],
      globals: false,
      browser: {
        name: 'chrome',
        enabled: true,
      },
    },
  },
])
