import { config } from 'dotenv'
import { defineConfig } from 'vitest/config'
import ts from 'typescript'

config()

// Runs the test suite with the *user's* code (everything under projects/tests)
// compiled with tc39 *standard* decorators, while remult core keeps the legacy
// `experimentalDecorators` semantics it actually ships with. This mirrors the
// real adoption scenario - a user opting into standard decorators against the
// published (legacy-compiled) library - and exercises mixed-mode inheritance
// (tc39 entities extending remult's legacy-compiled IdEntity/EntityBase).
//
// esbuild (vitest's default transformer) can't lower standard decorators, so
// every .ts file is transpiled with the TypeScript compiler instead; esbuild is
// disabled (see below) so it doesn't re-process / down-level the output.
const transpileTc39 = {
  name: 'remult-tc39-decorators',
  enforce: 'pre' as const,
  transform(code: string, id: string) {
    const file = id.split('?')[0].replace(/\\/g, '/')
    if (!/\.tsx?$/.test(file) || file.endsWith('.d.ts')) return null
    if (file.includes('/node_modules/')) return null
    // Standard decorators (which mandate useDefineForClassFields) for the user's
    // test code; legacy decorators for remult core - matching how each is built.
    const isUserCode = file.includes('/projects/tests/')
    const out = ts.transpileModule(code, {
      fileName: file,
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        experimentalDecorators: !isUserCode,
        useDefineForClassFields: isUserCode,
        esModuleInterop: true,
        importHelpers: false,
        sourceMap: true,
        jsx: ts.JsxEmit.Preserve,
      },
    })
    return { code: out.outputText, map: out.sourceMapText }
  },
}

export default defineConfig({
  plugins: [transpileTc39],
  esbuild: false,
  test: {
    fileParallelism: false,
    include: [
      './projects/tests/**/*.spec.ts',
      './projects/tests/**/*.backend-spec.ts',
      './projects/tests/dbs/sql-lite.spec.ts',
    ],
    reporters: ['default'],
    globals: false,
  },
})

process.env['IGNORE_GLOBAL_REMULT_IN_TESTS'] = 'true'
