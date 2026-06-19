import { config } from 'dotenv'
import { defineConfig } from 'vitest/config'
import ts from 'typescript'

config()

// esbuild (vitest's default transformer) does not support tc39 *standard*
// decorators - it only handles the legacy `experimentalDecorators` form. To
// test that remult's decorators work under standard decorators, files named
// `*.tc39.ts` are transpiled with the TypeScript compiler (standard decorators)
// before esbuild sees them. The lowered output contains no decorator syntax, so
// esbuild passes it through unchanged.
const tc39Decorators = {
  name: 'remult-tc39-decorators',
  enforce: 'pre' as const,
  transform(code: string, id: string) {
    if (!id.endsWith('.tc39.ts')) return null
    const out = ts.transpileModule(code, {
      fileName: id,
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        experimentalDecorators: false,
        useDefineForClassFields: true,
        esModuleInterop: true,
        sourceMap: true,
      },
    })
    return { code: out.outputText, map: out.sourceMapText }
  },
}

export default defineConfig({
  plugins: [tc39Decorators],
  test: {
    // threads: false,
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

process.env['IGNORE_GLOBAL_REMULT_IN_TESTS'] = 'true'
