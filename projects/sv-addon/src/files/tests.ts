import type { Ctx } from '../ctx.ts'
import { lines } from '../lines.ts'

/**
 * Entity rules, tested the way the UI asks them: `apiDeleteAllowed(row)`.
 * No server, no database - an in-memory Remult instance per test.
 */
/**
 * Our rules, not remult's: who becomes admin, and what a second person gets.
 * In-memory data provider, fake cookies - no server, no database.
 */
export function authSpecFile(ctx: Ctx) {
  return lines(
    `import type { RequestEvent } from '@sveltejs/kit'`,
    `import { InMemoryDataProvider, remult, repo } from 'remult'`,
    `import { beforeEach, describe, expect, it } from 'vitest'`,
    ``,
    `import { User } from './User.ts'`,
    `import { Roles } from '${ctx.lib}/roles.ts'`,
    `import { getUser, signIn, startImpersonation, stopImpersonation } from './auth.server.ts'`,
    ``,
    `/** Just enough of a RequestEvent for the cookie jar our session code touches. */`,
    `function fakeEvent() {`,
    `  const jar = new Map<string, string>()`,
    `  return {`,
    `    cookies: {`,
    `      get: (name: string) => jar.get(name),`,
    `      set: (name: string, value: string) => jar.set(name, value),`,
    `      delete: (name: string) => jar.delete(name),`,
    `    },`,
    `  } as unknown as RequestEvent`,
    `}`,
    ``,
    `describe('sign in', () => {`,
    `  beforeEach(() => {`,
    `    remult.dataProvider = new InMemoryDataProvider()`,
    `    remult.user = undefined`,
    `  })`,
    ``,
    `  it('hands the whole app to the first account', async () => {`,
    `    const event = fakeEvent()`,
    `    expect(await signIn(event, 'first@example.com')).toEqual({ ok: true })`,
    ``,
    `    const user = await repo(User).findFirst({ email: 'first@example.com' })`,
    `    expect(user?.roles).toContain(Roles.admin)`,
    `    expect(await getUser(event)).toMatchObject({ name: 'first' })`,
    `  })`,
    ``,
    `  it('gives everyone after that nothing', async () => {`,
    `    await signIn(fakeEvent(), 'first@example.com')`,
    `    await signIn(fakeEvent(), 'second@example.com')`,
    ``,
    `    const second = await repo(User).findFirst({ email: 'second@example.com' })`,
    `    expect(second?.roles).toEqual([])`,
    `  })`,
    ``,
    `  it('reuses the account instead of creating twins', async () => {`,
    `    await signIn(fakeEvent(), 'SAME@example.com')`,
    `    await signIn(fakeEvent(), ' same@example.com ')`,
    ``,
    `    expect(await repo(User).count()).toBe(1)`,
    `  })`,
    ``,
    `  it('refuses a non-email', async () => {`,
    `    expect(await signIn(fakeEvent(), 'nope')).toEqual({ error: expect.any(String) })`,
    `    expect(await repo(User).count()).toBe(0)`,
    `  })`,
    `})`,
    ``,
    `describe('impersonation', () => {`,
    `  beforeEach(() => {`,
    `    remult.dataProvider = new InMemoryDataProvider()`,
    `  })`,
    ``,
    `  it('remembers who you really are, and gives you back', async () => {`,
    `    const event = fakeEvent()`,
    `    await signIn(event, 'admin@example.com')`,
    `    const other = await repo(User).insert({ email: 'other@example.com', name: 'other' })`,
    ``,
    `    startImpersonation(event, other.id)`,
    `    const seen = await getUser(event)`,
    `    expect(seen).toMatchObject({ name: 'other', impersonatorName: 'admin' })`,
    ``,
    `    stopImpersonation(event)`,
    `    expect(await getUser(event)).toMatchObject({ name: 'admin', impersonatorName: undefined })`,
    `  })`,
    `})`,
    ``,
  )
}

/** The session cookie is our own crypto - the one thing worth testing twice. */
export function sessionSpecFile(ctx: Ctx) {
  return `import { describe, expect, it } from 'vitest'

import { signSession, unsignSession } from './session.server.ts'

describe('session token', () => {
  it('round-trips a user id', () => {
    expect(unsignSession(signSession('user-1'))).toBe('user-1')
  })

  it('rejects a tampered payload', () => {
    const token = signSession('user-1')
    expect(unsignSession(token.replace('user-1', 'user-2'))).toBeUndefined()
  })

  it('rejects garbage', () => {
    expect(unsignSession('user-1.not-a-mac')).toBeUndefined()
    expect(unsignSession('nonsense')).toBeUndefined()
    expect(unsignSession(undefined)).toBeUndefined()
  })
})
`
}

/** Signing lives apart from the cookie plumbing so it can be tested without SvelteKit. */
export function sessionFile(ctx: Ctx) {
  return `import { createHmac, timingSafeEqual } from 'node:crypto'
import { dev } from '${ctx.appEnv}'
${ctx.kit3 ? `import { AUTH_SECRET } from '$app/env/private'` : `import { env } from '$env/dynamic/private'`}

function secret() {
  const s = ${ctx.kit3 ? 'AUTH_SECRET' : 'env.AUTH_SECRET'}
  if (!s && !dev) throw new Error('AUTH_SECRET is required in production')
  return s || 'dev-only-insecure-secret'
}

export function signSession(userId: string) {
  const mac = createHmac('sha256', secret()).update(userId).digest('base64url')
  return \`\${userId}.\${mac}\`
}

export function unsignSession(token: string | undefined) {
  if (!token) return undefined
  const i = token.lastIndexOf('.')
  if (i < 1) return undefined
  const expected = Buffer.from(signSession(token.slice(0, i)))
  const got = Buffer.from(token)
  // Constant-time compare: a fast fail leaks how much of the mac was right.
  if (expected.length !== got.length || !timingSafeEqual(expected, got)) return undefined
  return token.slice(0, i)
}
`
}
