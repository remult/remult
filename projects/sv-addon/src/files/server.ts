import type { Ctx } from '../ctx.ts'
import { lines } from '../lines.ts'

/** Kit 3 declares env vars in `src/env.ts` and imports them by name. */
export function envImport(ctx: Ctx, name: string) {
  return ctx.kit3 ? `import { ${name} } from '$app/env/private'` : `import { env } from '$env/dynamic/private'`
}
export function envRef(ctx: Ctx, name: string) {
  return ctx.kit3 ? name : `env.${name}`
}

/** Kit 3's env manifest - the single place a private variable is declared. */
export function envDeclarationFile(ctx: Ctx) {
  return lines(
    `import { defineEnvVars } from '@sveltejs/kit/env'`,
    ``,
    `// \`schema: (v) => v\` = optional: the app boots without it.`,
    `export const variables = defineEnvVars({`,
    `  DATABASE_URL: {`,
    `    description: 'Postgres connection string. Unset = JSON files in ./db.',`,
    `    schema: (value) => value,`,
    `  },`,
    ctx.auth && `  SUPER_ADMIN_EMAILS: {`,
    ctx.auth && `    description: 'Comma-separated emails that always get every role. Put yours here.',`,
    ctx.auth && `    schema: (value) => value,`,
    ctx.auth && `  },`,
    ctx.auth && `  AUTH_SECRET: {`,
    ctx.auth && `    description: 'Signs the session cookie. Generate one: openssl rand -base64 32',`,
    ctx.auth && `    schema: (value) => value,`,
    ctx.auth && `  },`,
    ctx.auth && `  REQUIRE_EMAIL_VERIFICATION: {`,
    ctx.auth && `    description: "'true' to make people click a mailed link before their first sign-in.",`,
    ctx.auth && `    schema: (value) => value === 'true',`,
    ctx.auth && `  },`,
    ctx.internal && `  SMTP_URL: {`,
    ctx.internal && `    description: 'smtp://user:pass@host:587. Unset = an ethereal.email test inbox.',`,
    ctx.internal && `    schema: (value) => value,`,
    ctx.internal && `  },`,
    `})`,
    ``,
  )
}

export function dbFile(ctx: Ctx) {
  return lines(
    `import { building } from '${ctx.appEnv}'`,
    envImport(ctx, 'DATABASE_URL'),
    `import { createPostgresDataProvider } from 'remult/postgres'`,
    `import { JsonFileDataProvider } from 'remult/server'`,
    ``,
    `/** Postgres as soon as DATABASE_URL is set, JSON files in ./db otherwise. */`,
    `export const usingPostgres = Boolean(${envRef(ctx, 'DATABASE_URL')})`,
    ``,
    `export function createDataProvider() {`,
    `  if (building) return undefined`,
    `  if (usingPostgres) return createPostgresDataProvider({ connectionString: ${envRef(ctx, 'DATABASE_URL')} })`,
    `  return new JsonFileDataProvider('./db')`,
    `}`,
    ``,
  )
}

export function apiFile(ctx: Ctx) {
  const modules = ctx.ff || ctx.internal
  const mailEnv = ctx.ff && ctx.internal
  return lines(
    `import { remultApi } from 'remult/remult-sveltekit'`,
    mailEnv && envImport(ctx, 'SMTP_URL'),
    ctx.ff && `import { changeLog } from 'firstly/changeLog/server'`,
    ctx.ff && ctx.internal && `import { cron } from 'firstly/cron/server'`,
    ctx.ff && ctx.internal && `import { mail } from 'firstly/mail/server'`,
    ctx.ff && ctx.internal && `import { sqlAdmin } from 'firstly/sqlAdmin/server'`,
    ``,
    `import { entities } from '${ctx.lib}/entities.ts'`,
    `import { createDataProvider, usingPostgres } from './db.ts'`,
    ctx.auth && `import { getUser } from '${ctx.mod}/auth/auth.server.ts'`,
    `import { seed } from './seed.ts'`,
    ``,
    `export const api = remultApi({`,
    `  entities,`,
    `  dataProvider: createDataProvider(),`,
    ctx.auth && `  getUser,`,
    ctx.admin && `  admin: true,`,
    `  // Seeding is idempotent: it only fills an empty database.`,
    `  initApi: seed,`,
    modules && `  modules: [`,
    ctx.ff && `    changeLog(),`,
    ctx.ff &&
      ctx.internal &&
      `    cron([{ topic: 'heartbeat', cronTime: '*/5 * * * *', onTick: () => ({ at: new Date().toISOString() }) }]),`,
    ctx.ff && ctx.internal && `    // No SMTP_URL? firstly borrows an ethereal.email inbox - test mails still work,`,
    ctx.ff && ctx.internal && `    // they just never reach a real person. Every mail is stored either way.`,
    ctx.ff &&
      ctx.internal &&
      `    mail({ saveHtml: true, enableTest: true, nodemailer: { transport: ${envRef(ctx, 'SMTP_URL')} } }),`,
    ctx.ff && ctx.internal && `    // Raw SQL needs a real SQL database.`,
    ctx.ff && ctx.internal && `    ...(usingPostgres ? [sqlAdmin({ path: '/internal/sql' })] : []),`,
    modules && `  ],`,
    `})`,
    ``,
  )
}

export function seedFile(ctx: Ctx) {
  return lines(
    `import { repo } from 'remult'`,
    ``,
    ctx.auth && `import { User } from '${ctx.mod}/auth/User.ts'`,
    `import { Task } from '${ctx.mod}/task/Task.ts'`,
    ctx.auth && `import { superAdminEmails } from '${ctx.mod}/auth/auth.server.ts'`,
    ``,
    `/** Runs at every server start. Idempotent: it only fills what is missing. */`,
    `export async function seed() {`,
    ctx.auth && `  // No fake users: the first person to sign in owns the place (see auth.server.ts).`,
    ctx.auth && `  for (const email of superAdminEmails) {`,
    ctx.auth && `    await repo(User).upsert({ where: { email }, set: { name: email.split('@')[0] } })`,
    ctx.auth && `  }`,
    ctx.crud && `  if ((await repo(Task).count()) === 0) {`,
    ctx.crud && `    await repo(Task).insert([`,
    ctx.crud && `      { title: 'Open the onboarding panel (bottom right)', priority: 'high' },`,
    ctx.crud && `      { title: 'Add a field to src/modules/task/Task.ts', priority: 'normal' },`,
    ctx.crud && `    ])`,
    ctx.crud && `  }`,
    `}`,
    ``,
  )
}

export function authServerFile(ctx: Ctx) {
  return `import type { RequestEvent } from '@sveltejs/kit'
import { repo, type UserInfo } from 'remult'
${ctx.internal ? `import { sendMail } from 'firstly/mail/server'
` : ''}import { dev } from '${ctx.appEnv}'
${ctx.kit3 ? `import { REQUIRE_EMAIL_VERIFICATION, SUPER_ADMIN_EMAILS } from '$app/env/private'` : `import { env } from '$env/dynamic/private'`}

import { User } from '${ctx.mod}/auth/User.ts'
import { ADMIN_ROLES } from '${ctx.lib}/roles.ts'
import { signSession as sign, unsignSession as unsign } from './session.server.ts'

/** Emails that are admin by configuration, not by database row. */
export const superAdminEmails = (${envRef(ctx, 'SUPER_ADMIN_EMAILS')} ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

export const isSuperAdmin = (email: string) => superAdminEmails.includes(email.toLowerCase())

const EMAIL_RE = /^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/
const requireEmailVerification = ${envRef(ctx, 'REQUIRE_EMAIL_VERIFICATION')} === true
const LINK_TTL_MS = 1000 * 60 * 30

export type SignInResult = { ok: true } | { pending: true } | { error: string }

/**
 * One door for signing in and signing up: no password, no seeded accounts.
 * The first account ever created gets every role - whoever deploys owns the app.
 */
export async function signIn(event: RequestEvent, rawEmail: string): Promise<SignInResult> {
  const email = rawEmail.trim().toLowerCase()
  if (!EMAIL_RE.test(email)) return { error: 'Enter a valid email address' }

  let user = await repo(User).findFirst({ email })
  if (!user) {
    const isFirst = (await repo(User).count()) === 0
    user = await repo(User).insert({
      email,
      name: email.split('@')[0],
      roles: isFirst ? ADMIN_ROLES : [],
    })
  }

  if (requireEmailVerification && !user.verifiedAt) {
    await sendSignInLink(event, user)
    return { pending: true }
  }

  setSession(event, user.id)
  return { ok: true }
}

async function sendSignInLink(event: RequestEvent, user: User) {
  const token = sign(\`\${user.id}|\${Date.now() + LINK_TTL_MS}\`)
  const link = new URL(\`/login/verify?token=\${encodeURIComponent(token)}\`, event.url.origin).href
${
  ctx.internal
    ? `  await sendMail('sign-in', {
    to: user.email,
    subject: 'Your sign-in link',
    sections: [
      {
        html: \`Hi \${user.name}, here is your sign-in link. It expires in 30 minutes.\`,
        cta: { html: 'Sign in', link },
      },
    ],
  })`
    : `  // No mail module in this project: log the link so it is still usable.
  console.info('sign-in link', link)`
}
}

/** Consumes a link from \`sendSignInLink\`. Marks the email verified and opens the session. */
export async function verifySignInLink(event: RequestEvent, token: string) {
  const payload = unsign(token)
  if (!payload) return { error: 'This link is not valid' }
  const [userId, expiresAt] = payload.split('|')
  if (Number(expiresAt) < Date.now()) return { error: 'This link has expired' }

  const user = await repo(User).findId(userId)
  if (!user) return { error: 'This link is not valid' }
  if (!user.verifiedAt) await repo(User).update(user.id, { verifiedAt: new Date() })

  setSession(event, user.id)
  return { ok: true as const }
}

const SESSION = 'remult_session'
/** Who started the impersonation - lets "login as" be reversible. */
const IMPERSONATOR = 'remult_impersonator'

const cookieOptions = { path: '/', httpOnly: true, sameSite: 'lax', secure: !dev, maxAge: 60 * 60 * 24 * 7 } as const

export function setSession(event: RequestEvent, userId: string) {
  event.cookies.set(SESSION, sign(userId), cookieOptions)
}

export function clearSession(event: RequestEvent) {
  event.cookies.delete(SESSION, { path: '/' })
  event.cookies.delete(IMPERSONATOR, { path: '/' })
}

export function currentUserId(event: RequestEvent) {
  return unsign(event.cookies.get(SESSION))
}

export function impersonatorId(event: RequestEvent) {
  return unsign(event.cookies.get(IMPERSONATOR))
}

/** Become \`userId\`, remembering who we really are (unless already impersonating). */
export function startImpersonation(event: RequestEvent, userId: string) {
  const real = impersonatorId(event) ?? currentUserId(event)
  if (real && real !== userId) event.cookies.set(IMPERSONATOR, sign(real), cookieOptions)
  else event.cookies.delete(IMPERSONATOR, { path: '/' })
  setSession(event, userId)
}

/** Back to the real user. Always allowed: it can only restore, never escalate. */
export function stopImpersonation(event: RequestEvent) {
  const real = impersonatorId(event)
  event.cookies.delete(IMPERSONATOR, { path: '/' })
  if (real) setSession(event, real)
  else event.cookies.delete(SESSION, { path: '/' })
  return real
}

/** Called by remult on every request, before any API rule runs. */
export async function getUser(event: RequestEvent): Promise<UserInfo | undefined> {
  const userId = currentUserId(event)
  if (!userId) return undefined
  const user = await repo(User).findId(userId)
  if (!user) return undefined
  // Roles from the row, plus everything if the email is a configured super admin.
  const roles = [...new Set([...user.roles, ...(isSuperAdmin(user.email) ? ADMIN_ROLES : [])])]
  // Impersonation travels on the user itself, so the client never needs a load function.
  const realId = impersonatorId(event)
  const real = realId ? await repo(User).findId(realId) : undefined
  return { id: user.id, name: user.name, roles, impersonatorName: real?.name }
}
`
}

export function hooksFile(ctx: Ctx) {
  return lines(
    ctx.kit3
      ? `import { sequence, type Handle } from '@sveltejs/kit/hooks'`
      : `import type { Handle } from '@sveltejs/kit'`,
    !ctx.kit3 && `import { sequence } from '@sveltejs/kit/hooks'`,
    ctx.ff && `import { handleCaching } from 'firstly/svelte/server'`,
    ``,
    `import { getTextDirection } from '${ctx.lib}/paraglide/runtime.js'`,
    `import { paraglideMiddleware } from '${ctx.lib}/paraglide/server.js'`,
    `import { api } from '${ctx.lib}/server/api.ts'`,
    ctx.auth && `import { guard } from '${ctx.mod}/auth/guard.server.ts'`,
    ``,
    `const handleParaglide: Handle = ({ event, resolve }) =>`,
    `  paraglideMiddleware(event.request, ({ request, locale }) =>`,
    `    resolve(`,
    `      { ...event, request },`,
    `      {`,
    `        transformPageChunk: ({ html }) =>`,
    `          html.replace('%paraglide.lang%', locale).replace('%paraglide.dir%', getTextDirection(locale)),`,
    `      },`,
    `    ),`,
    `  )`,
    ``,
    ctx.ff && `// handleCaching: immutable assets cached forever, everything else never - deploy-safe.`,
    `export const handle = sequence(${ctx.ff ? 'handleCaching, ' : ''}handleParaglide, api${ctx.auth ? ', guard' : ''})`,
    ``,
  )
}

export function apiRouteFile(ctx: Ctx) {
  return `import { api } from '${ctx.lib}/server/api.ts'

export const { GET, POST, PUT, DELETE } = api
`
}

export function envFiles(ctx: Ctx) {
  return lines(
    `# Unset = JSON files in ./db. Set it (docker compose up -d) and remult switches to postgres.`,
    `# DATABASE_URL="postgres://postgres:postgres@localhost:5432/app"`,
    ctx.auth && ``,
    ctx.auth && `# Signs the session cookie. Generate one: openssl rand -base64 32`,
    ctx.auth && `AUTH_SECRET="dev-only-insecure-secret"`,
    ctx.auth && ``,
    ctx.auth && `# The first account created becomes admin. This is only a later escape hatch:`,
    ctx.auth && `# any email listed here holds every role, whatever the database says.`,
    ctx.auth && `# SUPER_ADMIN_EMAILS="you@example.com"`,
    ctx.auth && ``,
    ctx.auth && `# Make people click a mailed link before their first sign-in.`,
    ctx.auth && `REQUIRE_EMAIL_VERIFICATION="false"`,
    ``,
    `# Where mail goes. Unset = an ethereal.email test inbox (nothing reaches a real person).`,
    `# SMTP_URL="smtp://user:pass@smtp.example.com:587"`,
    ``,
  )
}

export const dockerCompose = `services:
  db:
    image: postgres:17-alpine
    restart: unless-stopped
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app
    ports:
      - '5432:5432'
    volumes:
      - db:/var/lib/postgresql/data

volumes:
  db:
`
