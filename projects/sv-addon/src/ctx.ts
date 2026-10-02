import type { Feature } from './options.ts'

export type Ctx = {
  /** `#lib` on kit 3, `$lib` before. */
  lib: string
  kit3: boolean
  /** `$app/env` on kit 3, `$app/environment` before. */
  appEnv: string
  /** Feature modules live beside `lib`, not inside it. */
  mod: string
  /** e.g. `src/lib` */
  libDir: string
  /** e.g. `src/routes` */
  routes: string
  ff: boolean
  crud: boolean
  auth: boolean
  admin: boolean
  internal: boolean
  onboarding: boolean
  ai: boolean
}

export function buildCtx(args: {
  options: Record<string, unknown>
  lib: string
  libDir: string
  routes: string
  kit3?: boolean
}): Ctx {
  const { preset, firstly, features } = args.options as {
    preset: 'full' | 'pick'
    firstly?: boolean
    features?: Feature[]
  }
  const full = preset === 'full'
  const has = (f: Feature) => full || (features ?? []).includes(f)
  const kit3 = args.kit3 ?? true

  return {
    lib: args.lib,
    kit3,
    appEnv: kit3 ? '$app/env' : '$app/environment',
    mod: kit3 ? '#modules' : '$modules',
    libDir: args.libDir,
    routes: args.routes,
    ff: full || firstly !== false,
    crud: has('crud'),
    auth: has('auth'),
    admin: has('admin'),
    internal: has('internal'),
    onboarding: has('onboarding'),
    ai: has('ai'),
  }
}
