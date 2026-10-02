// Post-processes the generated app for Railway: IaC file + template README.
// sv-addon-railway only wires Postgres when it sees drizzle, and it points `start` at
// `node build` - remult needs its own server (gzip with the SSE endpoint bypassed).
import fs from 'node:fs'
import path from 'node:path'

const [, , out, appName = 'Remult SvelteKit'] = process.argv
if (!out) throw new Error('usage: railway-config.mjs <app-dir> [app name]')

// Railway mints this slug when the template is published - override it with TEMPLATE_URL.
const templateUrl = process.env.TEMPLATE_URL ?? 'https://railway.com/deploy/remult-sveltekit-starter'

const write = (rel, content) => {
	const file = path.join(out, rel)
	fs.mkdirSync(path.dirname(file), { recursive: true })
	fs.writeFileSync(file, content)
}

write(
	'.railway/railway.ts',
	`import { defineRailway, postgres, preserve, project, service } from 'railway/iac'

export default defineRailway(() => {
	const db = postgres('Postgres')

	const web = service('SvelteKit', {
		build: 'pnpm run build',
		// gzip everything but remult's SSE endpoint, which must stay unbuffered
		start: 'node scripts/prod-server.js',
		// A generated *.up.railway.app domain is the one thing IaC cannot mint for you:
		// \`domains\` here means custom domains. Set the target port in the template (or click
		// "Generate Domain" once) and Railway routes to PORT below.
		env: {
			PORT: '3000',
			DATABASE_URL: db.env.DATABASE_URL,
			// adapter-node needs ORIGIN to trust Railway's proxy
			ORIGIN: 'https://\${{RAILWAY_PUBLIC_DOMAIN}}',
			// set once in Railway, never committed
			AUTH_SECRET: preserve(),
			SUPER_ADMIN_EMAILS: preserve(),
		},
		deploy: {
			healthcheckPath: '/',
			sleepApplication: true,
		},
	})

	return project('${appName}', {
		resources: [web, db],
	})
})
`,
)

// The railway add-on forces \`node build\`; remult's server is not optional.
const pkgPath = path.join(out, 'package.json')
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
pkg.name = 'remult-sveltekit-template-railway'
pkg.scripts.start = 'node scripts/prod-server.js'
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, '\t') + '\n')

write(
	'README.md',
	`# ${appName} on Railway

[![Deploy on Railway](https://railway.com/button.svg)](${templateUrl})

A full-stack SvelteKit app where **the data model is the app**: declare an entity once and you get
a typed REST API, validation on both sides, live queries over SSE, and an admin UI.
Built on [remult](https://remult.dev) and [firstly](https://firstly.fun).

## Deploy

1. Click the button. Railway creates the app and a Postgres database, and wires \`DATABASE_URL\`.
2. On the **SvelteKit** service, set:
   - \`AUTH_SECRET\` - \`openssl rand -base64 32\`
   - \`SUPER_ADMIN_EMAILS\` - your email, so you are admin on first sign-in
3. Open the app, sign in with that email, and follow the getting-started panel (bottom right).

Seeing **Unexposed service**? The service has no public domain yet: Settings → Networking →
**Generate Domain** (target port \`3000\`), then redeploy once so \`ORIGIN\` picks it up.

Deploying from a clone instead? \`railway login && railway link && railway config apply\` applies
[\`.railway/railway.ts\`](.railway/railway.ts).

## Develop

\`\`\`sh
pnpm install
pnpm dev          # JSON files in ./db - zero setup. Set DATABASE_URL for postgres.
pnpm test:unit    # entity rules + session signature
\`\`\`

## What's inside

- **API** - remult at \`/api\`, entities in \`src/lib/entities/\`, schema created on boot
- **Admin UI** - \`/api/admin\`, generated from your entities, gated by your API rules
- **Auth** - signed cookie session, login-as with a way back, \`SUPER_ADMIN_EMAILS\`
- **Backstage** - \`/app/internal\`: users, cron runs, mails, read-only SQL console
- **Craft** - Tailwind v4 tokens (light/dark, no flash), Paraglide \`en\`/\`fr\`, OG tags from
  \`src/lib/site.ts\`, vitest, ESLint + Prettier, \`AGENTS.md\` + agent skills from the library repos

## Regenerating

This repo is generated - don't hand-edit it. Change the add-on and re-run:

\`\`\`sh
# in remult/remult, projects/sv-addon
PUSH=1 ./railway/make-template.sh
\`\`\`

Which is, in essence:

\`\`\`sh
npx sv create my-app --types ts --template minimal
npx sv add tailwindcss paraglide vitest file:../sv-addon-railway '@remult'
\`\`\`
`,
)

console.info('railway config + README written')
