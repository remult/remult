import type { Ctx } from '../ctx.ts'
import { lines } from '../lines.ts'

/**
 * Session lives in a cookie, so it needs the server - but not a `+page.server.ts`.
 * Remote functions give us cookie access from anywhere, keeping routes data-free.
 */
export function authRemoteFile(ctx: Ctx) {
  return lines(
    `import { error } from '@sveltejs/kit'`,
    `import { command, form, getRequestEvent, query } from '$app/server'`,
    `import { remult, repo } from 'remult'`,
    `import { dev } from '${ctx.appEnv}'`,
    ``,
    `import { User } from '${ctx.mod}/auth/User.ts'`,
    `import { ADMIN_ROLES, Roles } from '${ctx.lib}/roles.ts'`,
    `import {`,
    `  clearSession,`,
    `  signIn as openSession,`,
    `  startImpersonation,`,
    `  stopImpersonation,`,
    `} from '${ctx.mod}/auth/auth.server.ts'`,
    ``,
    `/**`,
    ` * The signed-in user. Assigned to \`remult.user\` in the root layout, which fills it for`,
    ` * SSR (resolved in-process) and CSR (the serialized value), with no round trip either way.`,
    ` */`,
    `export const me = query(async () => remult.user ?? null)`,
    ``,
    `/** Drives the sign-in copy: the first account is the one that gets every role. */`,
    `export const isFirstAccount = query(async () => (await repo(User).count()) === 0)`,
    ``,
    `// No redirect here on purpose: the caller does a full page load, so the new session`,
    `// reaches remult, the entities and every live query at once.`,
    `export const signIn = form('unchecked', async (data: { email?: string }) => {`,
    `  const result = await openSession(getRequestEvent(), data.email ?? '')`,
    `  if ('error' in result) return { error: result.error, email: data.email }`,
    `  if ('pending' in result) return { pending: true, email: data.email }`,
    `  return { ok: true }`,
    `})`,
    ``,
    `export const signOut = command(async () => {`,
    `  clearSession(getRequestEvent())`,
    `})`,
    ``,
    `/** Impersonation: admins anywhere, anybody in dev. Reversible via \`backToMe\`. */`,
    `export const loginAs = command('unchecked', async (userId: string) => {`,
    `  if (!dev && !remult.isAllowed(Roles.admin)) error(403, 'Admins only')`,
    `  const user = await repo(User).findId(userId)`,
    `  if (!user) error(400, 'Unknown user')`,
    `  startImpersonation(getRequestEvent(), user.id)`,
    `})`,
    ``,
    `/** Always allowed: it can only restore the real user, never escalate. */`,
    `export const backToMe = command(async () => {`,
    `  stopImpersonation(getRequestEvent())`,
    `})`,
    ``,
    `/** The switcher list. Admin-only on the server, so a member gets an empty array. */`,
    `export const impersonationTargets = query(async () => {`,
    `  if (!remult.isAllowed([...ADMIN_ROLES])) return []`,
    `  const users = await repo(User).find({ limit: 20 })`,
    `  return users.map((u) => ({ id: u.id, name: u.name, email: u.email }))`,
    `})`,
    ``,
    `export const addMember = command('unchecked', async (email: string) => {`,
    `  const clean = email.trim().toLowerCase()`,
    `  if (!clean.includes('@')) error(400, 'Enter a valid email address')`,
    `  if (await repo(User).findFirst({ email: clean })) error(400, 'Already a member')`,
    `  await repo(User).insert({ email: clean, name: clean.split('@')[0] })`,
    `})`,
    ``,
  )
}

/** Facts only the server knows. Everything else comes through remult on the client. */
export function factsRemoteFile(ctx: Ctx) {
  return lines(
    `import { query } from '$app/server'`,
    `import { dev } from '${ctx.appEnv}'`,
    ``,
    `import { entities } from '${ctx.lib}/entities.ts'`,
    `import { usingPostgres } from '${ctx.lib}/server/db.ts'`,
    ``,
    `export const serverFacts = query(async () => ({`,
    `  usingPostgres,`,
    `  runtime: {`,
    `    database: usingPostgres ? 'postgres' : 'json files · ./db',`,
    `    mode: dev ? 'development' : 'production',`,
    `    node: process.version,`,
    `    entities: entities.length,`,
    `  },`,
    `  modules: [`,
    ctx.ff && `    { name: 'changeLog', on: true, hint: 'every write recorded' },`,
    ctx.ff && `    { name: 'cron', on: true, hint: 'heartbeat every 5 min' },`,
    ctx.ff && `    { name: 'mail', on: true, hint: 'ethereal until you set SMTP_URL' },`,
    ctx.ff && `    { name: 'sqlAdmin', on: usingPostgres, hint: usingPostgres ? 'read-only console' : 'needs DATABASE_URL' },`,
    ctx.admin && `    { name: 'admin', on: true, hint: '/api/admin' },`,
    `  ],`,
    `}))`,
    ``,
  )
}

/** The magic link is a plain GET, so it stays an endpoint - not a page load. */
export function verifyEndpointFile(ctx: Ctx) {
  return `import { redirect } from '@sveltejs/kit'

import { verifySignInLink } from '${ctx.mod}/auth/auth.server.ts'

export const GET = async (event) => {
  const result = await verifySignInLink(event, event.url.searchParams.get('token') ?? '')
  if ('error' in result) redirect(303, \`/login?error=\${encodeURIComponent(result.error ?? '')}\`)
  redirect(303, '/app')
}
`
}

/** Route guards belong to the request, not to a load function. */
export function guardHandleFile(ctx: Ctx) {
  return lines(
    `import { error, redirect } from '@sveltejs/kit'`,
    ctx.kit3
      ? `import type { Handle } from '@sveltejs/kit/hooks'`
      : `import type { Handle } from '@sveltejs/kit'`,
    `import { remult, repo } from 'remult'`,
    `import { dev } from '${ctx.appEnv}'`,
    ``,
    `import { User } from '${ctx.mod}/auth/User.ts'`,
    `import { ADMIN_ROLES } from '${ctx.lib}/roles.ts'`,
    `import { clearSession, startImpersonation } from '${ctx.mod}/auth/auth.server.ts'`,
    `import { devProfilesHint } from '${ctx.mod}/auth/devProfiles.server.ts'`,
    ``,
    `/** \`?login-as=someone@example.com\` switches identity, \`?login-as=\` drops to anonymous. */`,
    `const LOGIN_AS = 'login-as'`,
    ``,
    `/**`,
    ` * Runs inside remult's context (it is sequenced after \`api\`), so \`remult.user\` is set.`,
    ` * One place for every rule - no \`+layout.server.ts\` scattered around.`,
    ` */`,
    `export const guard: Handle = async ({ event, resolve }) => {`,
    `  const { pathname, searchParams } = event.url`,
    ``,
    `  // One URL to become anybody - the fastest debugging tool there is, and the one an agent`,
    `  // can drive. Admins only once deployed.`,
    `  if (searchParams.has(LOGIN_AS) && (dev || remult.isAllowed([...ADMIN_ROLES]))) {`,
    `    const email = searchParams.get(LOGIN_AS)!.trim().toLowerCase()`,
    `    if (email) {`,
    `      const user = await repo(User).findFirst({ email })`,
    `      if (user) startImpersonation(event, user.id)`,
    `    } else {`,
    `      clearSession(event)`,
    `    }`,
    `    searchParams.delete(LOGIN_AS)`,
    `    redirect(303, \`\${pathname}\${searchParams.size ? \`?\${searchParams}\` : ''}\`)`,
    `  }`,
    ``,
    ctx.internal && `  if (pathname.startsWith('/app/internal') && !remult.isAllowed([...ADMIN_ROLES])) {`,
    ctx.internal && `    error(403, 'Admins only')`,
    ctx.internal && `  }`,
    `  // Every page render reprints the switch-identity URLs: a hint you have to remember`,
    `  // is a hint nobody uses. Page requests only, dev only.`,
    `  if (dev && event.request.headers.get('accept')?.includes('text/html')) {`,
    `    console.info(await devProfilesHint())`,
    `  }`,
    ``,
    `  if (pathname.startsWith('/app') && !remult.authenticated()) {`,
    `    redirect(303, \`/login?redirectTo=\${encodeURIComponent(pathname)}\`)`,
    `  }`,
    `  return resolve(event)`,
    `}`,
    ``,
  )
}

/**
 * The identities worth hopping between while building. Named here, printed on every page
 * render - so the URLs are always in front of you, and in front of an agent reading the logs.
 */
export function devProfilesFile(ctx: Ctx) {
  return lines(
    `import { repo } from 'remult'`,
    ``,
    `import { User } from '${ctx.mod}/auth/User.ts'`,
    `import { Roles } from '${ctx.lib}/roles.ts'`,
    ``,
    `/** Name the profiles you actually care about. Add \`{ label, email }\` to pin a specific one. */`,
    `const PROFILES: { label: string; email?: string; match?: (user: User) => boolean }[] = [`,
    `  { label: 'admin', match: (u) => u.roles.includes(Roles.admin) },`,
    `  { label: 'member', match: (u) => !u.roles.includes(Roles.admin) },`,
    `]`,
    ``,
    `/** Dev only, so a few seconds of staleness is cheaper than a query per request. */`,
    `let cache: { at: number; hint: string } | undefined`,
    ``,
    `export async function devProfilesHint() {`,
    `  if (cache && Date.now() - cache.at < 5_000) return cache.hint`,
    ``,
    `  const users = await repo(User).find({ limit: 10, orderBy: { createdAt: 'asc' } })`,
    `  const lines = PROFILES.map(({ label, email, match }) => {`,
    `    const user = email ? users.find((u) => u.email === email) : users.find((u) => match?.(u))`,
    `    const target = user?.email ?? email`,
    "    return `  ${label.padEnd(9)} ${target ? `?login-as=${target}` : '(none yet)'}`",
    `  })`,
    "  lines.push('  anonymous ?login-as=')",
    ``,
    "  cache = { at: Date.now(), hint: ['switch identity:', ...lines].join('\\n') }",
    `  return cache.hint`,
    `}`,
    ``,
  )
}
