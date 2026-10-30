const g = globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> }
}
g.process = {
  ...g.process,
  env: {
    ...g.process?.env,
    IGNORE_GLOBAL_REMULT_IN_TESTS: 'true',
  },
}
