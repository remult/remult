import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['./projects/tests/*.spec.ts'],
    globals: true
  },

})