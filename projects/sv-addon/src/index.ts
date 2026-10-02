import path from 'node:path'
import { color, fileExists, isKit3, resolveLibPrefix, svelteConfig, transforms } from '@sveltejs/sv-utils'
import { defineAddon, type SvApi, type Workspace } from 'sv'

import { buildCtx, type Ctx } from './ctx.ts'
import { agentsSection } from './files/ai.ts'
import { entitiesIndexFile, rolesFile, taskFile, userFile } from './files/entities.ts'
import { localeSwitchFile, LOCALES, MESSAGES } from './files/i18n.ts'
import { onboardingComponentFile, onboardingStateFile } from './files/onboarding.ts'
import {
  appHomePage,
  cronsPage,
  errorPage,
  internalLayout,
  internalPage,
  landingPage,
  loginPage,
  mailsPage,
  publicHeaderFile,
  sqlPage,
  usersPage,
} from './files/pages.ts'
import { eslintConfigFile, prettierConfigFile, prettierIgnoreFile, prodServerFile } from './files/prod.ts'
import { readme } from './files/readme.ts'
import {
  authRemoteFile,
  devProfilesFile,
  factsRemoteFile,
  guardHandleFile,
  verifyEndpointFile,
} from './files/remote.ts'
import { authSpecFile, sessionFile, sessionSpecFile } from './files/tests.ts'
import {
  apiFile,
  apiRouteFile,
  authServerFile,
  dbFile,
  dockerCompose,
  envDeclarationFile,
  envFiles,
  hooksFile,
  seedFile,
} from './files/server.ts'
import { faviconSvg, ogImageSvg, siteFile, siteHeadFile, titleize } from './files/site.ts'
import {
  appLayoutFile,
  appShellFile,
  publicLayoutFile,
  rootLayoutFile,
  themeBootScript,
  themeCss,
  themeToggleFile,
  userMenuFile,
} from './files/ui.ts'
import { options } from './options.ts'

const REGEX_HEAD = /(\s*)%sveltekit\.head%/

const VERSIONS = {
  // Stable remult: `next` is a prerelease, which npm refuses against firstly's `>=3.3.7` peer.
  remult: '^3.3.18',
  firstly: '^0.10.1',
  pg: '^8.16.3',
  pgTypes: '^8.15.5',
  adapterNode: '^6.0.0-next.12',
  kitqlEslint: '^0.9.0',
  eslint: '10.4.0',
  prettier: '^3.8.3',
  oxfmt: '0.51.0',
  oxlint: '1.66.0',
  oxlintTsgolint: '0.23.0',
  polka: '^1.0.0-next.28',
  polkaCompression: '^1.0.0-next.25',
}

export default defineAddon({
  id: 'remult',
  shortDescription: 'full-stack CRUD, auth and admin from your entities',
  homepage: 'https://remult.dev',
  options,

  setup: ({ isKit, language, unsupported, dependsOn, runsAfter }) => {
    if (!isKit) unsupported('Requires SvelteKit')
    if (language !== 'ts') unsupported('Requires TypeScript (remult entities are decorated classes)')
    dependsOn('tailwindcss')
    dependsOn('paraglide')
    dependsOn('vitest')
    // Svelte's own skills + MCP server: the agent should know the framework, not guess it.
    dependsOn('ai-tools' as 'aiTools')
    runsAfter('tailwindcss')
    runsAfter('paraglide')
    runsAfter('vitest')
    runsAfter('ai-tools' as 'aiTools')
    runsAfter('sveltekit-adapter' as 'sveltekitAdapter')
    // Ids are matched at runtime; the types still expect the camelCase keys (sv will fix it).
    // Railway's add-on rewrites `start`, and ours must win (its SSE bypass is not optional).
    runsAfter('railway' as 'sveltekitAdapter')
  },

  run: async ({ sv, cwd, options, directory, file, dependencyVersion }) => {
    const kitRange = dependencyVersion('@sveltejs/kit')
    const ctx = buildCtx({
      options,
      lib: resolveLibPrefix(kitRange),
      libDir: directory.lib,
      routes: directory.kitRoutes,
      kit3: isKit3(kitRange),
    })
    const name = titleize(path.basename(cwd))

    dependencies(sv, ctx)
    config(sv, ctx, file)
    backend(sv, ctx)
    frontend(sv, ctx, file, name, cwd)
    tests(sv, ctx, cwd)
    i18n(sv)
    tooling(sv, ctx, file, cwd)
    prod(sv, file, cwd)
    if (ctx.ai) await ai(sv, ctx, file)
  },

  nextSteps: () => [
    `Run ${color.command('npm run dev')} - the onboarding panel walks you through the rest`,
    `First sign-in owns the app: open ${color.route('/login')} and use your own email`,
    `Browse your data at ${color.route('/api/admin')}`,
    `Postgres when you want it: ${color.command('docker compose up -d')} + ${color.env('DATABASE_URL')}`,
    `Agent skills come from the libraries: ${color.command('npm run skills:update')} keeps them current`,
    `Then ${color.command('npm run format')} once: the generator writes plain TS, your config owns the style`,
  ],
})

type Sv = SvApi
type File = Workspace['file']

function dependencies(sv: Sv, ctx: Ctx) {
  sv.devDependency('remult', VERSIONS.remult)
  if (ctx.ff) sv.devDependency('firstly', VERSIONS.firstly)
  // Drivers and the prod server stay real dependencies: adapter-node needs them at runtime.
  sv.dependency('pg', VERSIONS.pg)
  sv.devDependency('@types/pg', VERSIONS.pgTypes)
}

function config(sv: Sv, ctx: Ctx, file: File) {
  if (file.typeConfig) {
    sv.file(
      file.typeConfig,
      transforms.json(({ data }: { data: Record<string, any> }) => {
        data.compilerOptions ??= {}
        // Remult entities are decorated classes.
        data.compilerOptions.experimentalDecorators = true
      }),
    )
  }

  sv.file(
    file.package,
    transforms.json(({ data }: { data: Record<string, any> }) => {
      // Feature modules get the same treatment as `#lib`: a short, stable import prefix.
      data.imports ??= {}
      data.imports['#modules/*'] ??= './src/modules/*'
    }),
  )

  sv.file(
    file.gitignore,
    transforms.text(({ content }) => {
      const wanted = ['db', '.env']
      const missing = wanted.filter((l) => !content.split('\n').includes(l))
      return missing.length ? `${content.trimEnd()}\n${missing.join('\n')}\n` : content
    }),
  )

  const env = envFiles(ctx)
  sv.file('.env', (content) => (content.trim() ? content : env))
  sv.file('.env.example', () => env.replace('AUTH_SECRET="dev-only-insecure-secret"', 'AUTH_SECRET=""'))
  if (ctx.kit3) sv.file('src/env.ts', () => envDeclarationFile(ctx))

  sv.file('docker-compose.yml', () => dockerCompose)
}

function backend(sv: Sv, ctx: Ctx) {
  const lib = ctx.libDir
  const mod = 'src/modules'
  sv.file(`${lib}/roles.ts`, () => rolesFile(ctx))
  sv.file(`${mod}/task/Task.ts`, () => taskFile(ctx))
  if (ctx.auth) sv.file(`${mod}/auth/User.ts`, () => userFile(ctx))
  sv.file(`${lib}/entities.ts`, () => entitiesIndexFile(ctx))
  sv.file(`${lib}/server/db.ts`, () => dbFile(ctx))
  sv.file(`${lib}/server/seed.ts`, () => seedFile(ctx))
  if (ctx.auth) {
    // A feature owns its entity, its server code, its remote functions and its UI.
    sv.file(`${mod}/auth/session.server.ts`, () => sessionFile(ctx))
    sv.file(`${mod}/auth/auth.server.ts`, () => authServerFile(ctx))
    sv.file(`${mod}/auth/guard.server.ts`, () => guardHandleFile(ctx))
    sv.file(`${mod}/auth/devProfiles.server.ts`, () => devProfilesFile(ctx))
    sv.file(`${mod}/auth/auth.remote.ts`, () => authRemoteFile(ctx))
  }
  if (ctx.internal) sv.file(`${lib}/facts.remote.ts`, () => factsRemoteFile(ctx))
  sv.file(`${lib}/server/api.ts`, () => apiFile(ctx))
  sv.file('src/hooks.server.ts', () => hooksFile(ctx))
  sv.file(`${ctx.routes}/api/[...remult]/+server.ts`, () => apiRouteFile(ctx))
}

function frontend(sv: Sv, ctx: Ctx, file: File, name: string, cwd: string) {
  const lib = ctx.libDir
  const routes = ctx.routes

  const firstlySource = file.getRelative({ from: file.stylesheet, to: 'node_modules/firstly' })
  const theme = themeCss(ctx, firstlySource)
  sv.file(file.stylesheet, (content) =>
    // Already themed? Leave it alone - re-running the add-on must not stack a second copy,
    // and the tailwind add-on reformats this file (comments included), so we probe a token.
    content.includes('--brand-hue') ? content : content.trimEnd() + '\n' + theme,
  )

  // Before first paint: a dark-mode user must never see a white flash.
  sv.file('src/app.html', (content) =>
    content.includes("localStorage.getItem('theme')")
      ? content
      : content.replace(REGEX_HEAD, `\n${themeBootScript}$1%sveltekit.head%`),
  )

  if (ctx.auth) {
    sv.file('src/app.d.ts', (content) =>
      content.includes('impersonatorName')
        ? content
        : `${content.trimEnd()}

declare module 'remult' {
  interface UserInfo {
    /** Set while an admin is impersonating: who they really are. */
    impersonatorName?: string
  }
}
`,
    )
  }

  sv.file(`${lib}/site.ts`, () => siteFile(ctx, name))
  sv.file(`${lib}/ui/SiteHead.svelte`, () => siteHeadFile(ctx))
  sv.file('static/favicon.svg', () => faviconSvg)
  sv.file('static/og.svg', () => ogImageSvg(name, ctx))
  sv.file(`${lib}/assets/favicon.svg`, () => faviconSvg)

  const cssImport = file.getRelative({ from: `${routes}/+layout.svelte`, to: file.stylesheet })
  sv.file(`${routes}/+layout.svelte`, () => rootLayoutFile(ctx, cssImport))
  sv.file(`${routes}/+error.svelte`, () => errorPage(ctx))

  // Public half, in a route group so it can have its own (marketing) shell.
  if (fileExists(cwd, `${routes}/+page.svelte`)) sv.removeFile(`${routes}/+page.svelte`)
  sv.file(`${routes}/(public)/+layout.svelte`, () => publicLayoutFile(ctx))
  sv.file(`${routes}/(public)/+page.svelte`, () => landingPage(ctx))
  sv.file(`${lib}/ui/PublicHeader.svelte`, () => publicHeaderFile(ctx))
  if (ctx.auth) {
    sv.file(`${routes}/(public)/login/+page.svelte`, () => loginPage(ctx))
    // A magic link is a GET with a token: an endpoint, not a page load.
    sv.file(`${routes}/(public)/login/verify/+server.ts`, () => verifyEndpointFile(ctx))
  }

  // Private half.
  sv.file(`${routes}/app/+layout.svelte`, () => appLayoutFile(ctx))
  sv.file(`${routes}/app/+page.svelte`, () => appHomePage(ctx))

  sv.file(`${lib}/ui/AppShell.svelte`, () => appShellFile(ctx))
  sv.file(`${lib}/ui/ThemeToggle.svelte`, () => themeToggleFile)
  sv.file(`${lib}/ui/LocaleSwitch.svelte`, () => localeSwitchFile(ctx))
  if (ctx.auth) sv.file(`src/modules/auth/UserMenu.svelte`, () => userMenuFile(ctx))
  if (ctx.onboarding) {
    sv.file(`${lib}/ui/onboarding.svelte.ts`, () => onboardingStateFile(ctx))
    sv.file(`${lib}/ui/Onboarding.svelte`, () => onboardingComponentFile)
  }

  if (ctx.internal) {
    const internal = `${routes}/app/internal`
    sv.file(`${internal}/+layout.svelte`, () => internalLayout(ctx))
    sv.file(`${internal}/+page.svelte`, () => internalPage(ctx))
    if (ctx.auth) sv.file(`${internal}/users/+page.svelte`, () => usersPage(ctx))
    if (ctx.ff) {
      sv.file(`${internal}/crons/+page.svelte`, () => cronsPage)
      sv.file(`${internal}/mails/+page.svelte`, () => mailsPage)
      sv.file(`${internal}/sql/+page.svelte`, () => sqlPage(ctx))
    }
  }

  sv.file('README.md', () => readme(ctx, name))
}

/** Real tests, not a greet() placeholder: entity rules and our own crypto. */
function tests(sv: Sv, ctx: Ctx, cwd: string) {
  if (ctx.auth) {
    sv.file('src/modules/auth/auth.spec.ts', () => authSpecFile(ctx))
    sv.file('src/modules/auth/session.spec.ts', () => sessionSpecFile(ctx))
  }

  // The vitest add-on ships a greet() demo; we have better examples.
  for (const f of ['greet.ts', 'greet.spec.ts']) {
    const path = `${ctx.libDir}/vitest-examples/${f}`
    if (fileExists(cwd, path)) sv.removeFile(path)
  }
}

/** firstly's vite plugins + kitql's lint/format, the setup this stack assumes. */
function tooling(sv: Sv, ctx: Ctx, file: File, cwd: string) {
  if (ctx.ff) {
    sv.file(
      file.viteConfig,
      transforms.script(({ ast, js }: { ast: any; js: any }) => {
        // Idempotent: a second run must not stack a second firstly() plugin.
        if (js.imports.findAll(ast, { from: 'firstly/vite' }).length > 0) return false
        js.imports.addNamed(ast, { imports: ['firstly'], from: 'firstly/vite' })
        js.imports.addNamed(ast, { imports: ['KIT_ROUTES'], from: `${ctx.lib}/ROUTES.ts`, isType: true })
        js.vite.addPlugin(ast, {
          code: `firstly<KIT_ROUTES>({
			// stripper nullifies server-only modules in the client bundle;
			// kit 3 renamed them, so spell them out.
			stripper: { nullify: ['$app/env/private', '$env/static/private', '$env/dynamic/private'] },
		})`,
        })
      }),
    )
  }

  // Remote functions + await in markup: what lets every route stay free of server files.
  sv.file(file.viteConfig, (content) =>
    content.includes('remoteFunctions')
      ? content
      : content
          .replace('sveltekit({', 'sveltekit({\n\t\t\texperimental: { remoteFunctions: true },')
          .replace('compilerOptions: {', 'compilerOptions: {\n\t\t\t\texperimental: { async: true },'),
  )

  // sv's template inlines a regex in the runes callback; kitql's e18e rule wants it hoisted.
  sv.file(file.viteConfig, (content) =>
    content.includes('PATH_SEPARATOR_RE')
      ? content
      : content
          .replace('export default', 'const PATH_SEPARATOR_RE = /[/\\\\]/;\n\nexport default')
          .replace('filename.split(/[/\\\\]/)', 'filename.split(PATH_SEPARATOR_RE)'),
  )

  // kitql-lint wraps eslint + prettier (+ oxfmt) behind two scripts.
  sv.devDependency('@kitql/eslint-config', VERSIONS.kitqlEslint)
  sv.devDependency('eslint', VERSIONS.eslint)
  sv.devDependency('prettier', VERSIONS.prettier)
  sv.devDependency('oxfmt', VERSIONS.oxfmt)
  sv.devDependency('oxlint', VERSIONS.oxlint)
  sv.devDependency('oxlint-tsgolint', VERSIONS.oxlintTsgolint)

  if (!fileExists(cwd, 'eslint.config.js')) sv.file('eslint.config.js', () => eslintConfigFile)
  if (!fileExists(cwd, '.prettierrc.js')) sv.file('.prettierrc.js', () => prettierConfigFile)
  if (!fileExists(cwd, '.prettierignore')) sv.file('.prettierignore', () => prettierIgnoreFile)

  sv.file(
    file.package,
    transforms.json(({ data, json }: { data: Record<string, any>; json: any }) => {
      json.packageScriptsUpsert(data, 'lint', 'kitql-lint -d')
      json.packageScriptsUpsert(data, 'format', 'kitql-lint -d -f')
    }),
  )
}

function i18n(sv: Sv) {
  sv.file(
    'project.inlang/settings.json',
    transforms.json(({ data }: { data: Record<string, any> }) => {
      data.baseLocale ??= 'en'
      const locales: string[] = data.locales ?? []
      data.locales = [...new Set([...locales, ...LOCALES])]
    }),
  )

  for (const locale of LOCALES) {
    sv.file(
      `messages/${locale}.json`,
      transforms.json(({ data }: { data: Record<string, any> }) => {
        data['$schema'] = 'https://inlang.com/schema/inlang-message-format'
        for (const [key, value] of Object.entries(MESSAGES[locale])) data[key] ??= value
      }),
    )
  }
}

/** adapter-node + a compression-aware server: gzip everything but remult's SSE stream. */
function prod(sv: Sv, file: File, cwd: string) {
  sv.devDependency('@sveltejs/adapter-node', VERSIONS.adapterNode)
  sv.dependency('polka', VERSIONS.polka)
  sv.dependency('@polka/compression', VERSIONS.polkaCompression)

  sv.file(
    file.package,
    transforms.json(({ data }: { data: Record<string, any> }) => {
      for (const pkg of Object.keys(data.devDependencies ?? {})) {
        if (pkg.startsWith('@sveltejs/adapter-') && pkg !== '@sveltejs/adapter-node') delete data.devDependencies[pkg]
      }
    }),
  )

  svelteConfig.edit({ sv, cwd }, ({ ast, override, js }) => {
    // Retarget whichever adapter is already imported instead of adding a second one.
    const existing = ast.body
      .filter((n): n is Extract<typeof n, { type: 'ImportDeclaration' }> => n.type === 'ImportDeclaration')
      .find((n) => typeof n.source.value === 'string' && n.source.value.startsWith('@sveltejs/adapter-'))
    if (existing) {
      existing.source.value = '@sveltejs/adapter-node'
      existing.source.raw = undefined
    } else {
      js.imports.addDefault(ast, { from: '@sveltejs/adapter-node', as: 'adapter' })
    }
    override(
      { adapter: js.functions.createCall({ name: 'adapter', args: [], useIdentifiers: true }) },
      { dropLeadingComments: ['adapter'] },
    )
  })

  sv.file('scripts/prod-server.js', () => prodServerFile)
  sv.file(
    'package.json',
    transforms.json(({ data, json }: { data: Record<string, any>; json: any }) => {
      json.packageScriptsUpsert(data, 'start', 'node scripts/prod-server.js')
      json.packageScriptsUpsert(data, 'db:up', 'docker compose up -d')
    }),
  )
}

async function ai(sv: Sv, ctx: Ctx, file: File) {
  sv.file('AGENTS.md', (content) => {
    const section = agentsSection(ctx)
    if (content.includes('## This app')) return content
    return content.trim() ? `${content.trimEnd()}\n\n${section}` : `# AGENTS\n\n${section}`
  })

  // Skills come from the libraries themselves, so they never drift from the code they describe.
  const packages = ctx.ff ? ['remult/remult', 'jycouet/firstly'] : ['remult/remult']
  sv.file(
    file.package,
    transforms.json(({ data, json }: { data: Record<string, any>; json: any }) => {
      // One package per call: the CLI installs the first one only when given several.
      json.packageScriptsUpsert(
        data,
        'skills',
        packages.map((p) => `skills add ${p} -y`).join(' && '),
      )
      json.packageScriptsUpsert(data, 'skills:update', 'skills update -p -y')
    }),
  )

  if (process.env.CI || process.env.TESTING) return
  for (const pkg of packages) {
    try {
      await sv.execute(['skills@latest', 'add', pkg, '-y'], 'inherit')
    } catch {
      // Offline, or the user said no: `npm run skills` is there for later.
    }
  }
}
