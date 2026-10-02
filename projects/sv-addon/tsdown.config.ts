import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  // `sv` is provided by the CLI at runtime; everything else gets bundled.
  deps: { neverBundle: ['sv'] },
})
