import fs from 'node:fs'
import path from 'node:path'
import { createSetupTest } from 'sv/testing'
import * as vitest from 'vitest'
import { expect } from 'vitest'

import addon from '../src/index.ts'

const { test, testCases } = createSetupTest(vitest)(
  { addon },
  {
    kinds: [
      { type: 'full', options: { remult: { preset: 'full' } } },
      { type: 'minimal', options: { remult: { preset: 'pick', firstly: false, features: ['crud'] } } },
    ],
    // TypeScript only: remult entities are decorated classes.
    filter: (testCase) => testCase.variant.includes('kit-ts'),
    browser: false,
  },
)

test.concurrent.for(testCases)('remult $kind.type $variant', async (testCase, ctx) => {
  const cwd = ctx.cwd(testCase)
  const read = (p) => fs.readFileSync(path.resolve(cwd, p), 'utf8')

  expect(read('src/lib/server/api.ts')).toContain('remultApi(')
  expect(read('src/routes/api/[...remult]/+server.ts')).toContain('GET, POST, PUT, DELETE')
  expect(JSON.parse(read('tsconfig.json')).compilerOptions.experimentalDecorators).toBe(true)

  // Postgres code always ships; the env variable is what switches it on.
  expect(read('src/lib/server/db.ts')).toContain('DATABASE_URL')
  expect(read('src/lib/server/db.ts')).toContain('JsonFileDataProvider')
  expect(JSON.parse(read('package.json')).imports['#modules/*']).toBe('./src/modules/*')

  // Public landing + private app.
  expect(fs.existsSync(path.resolve(cwd, 'src/routes/(public)/+page.svelte'))).toBe(true)
  expect(fs.existsSync(path.resolve(cwd, 'src/routes/app/+page.svelte'))).toBe(true)
  expect(read('messages/fr.json')).toContain('landing_cta')

  const full = testCase.kind.type === 'full'
  // Features live in modules, shared plumbing in lib.
  expect(read('src/modules/task/Task.ts')).toContain(full ? 'FF_Entity' : '@Entity')
  expect(fs.existsSync(path.resolve(cwd, 'src/modules/auth/User.ts'))).toBe(full)
  expect(fs.existsSync(path.resolve(cwd, 'src/modules/auth/auth.server.ts'))).toBe(full)
  expect(fs.existsSync(path.resolve(cwd, 'src/lib/ui/Onboarding.svelte'))).toBe(full)
  // Skills are pulled from the library repos, not copied - we only wire the scripts.
  const scripts = JSON.parse(read('package.json')).scripts
  expect(Boolean(scripts.skills)).toBe(full)
  // Permission tests only exist when auth is part of the build.
  // Tests cover our rules (who becomes admin), not remult's behaviour.
  expect(fs.existsSync(path.resolve(cwd, 'src/modules/auth/auth.spec.ts'))).toBe(full)
})
