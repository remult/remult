// Generates docs/public/llms.txt - a curated llms.txt index of every doc page
// with a one-line summary per the llmstxt.org spec. Summaries come from the
// `llm:` frontmatter field on each authored .md file. Pages without `llm:`
// render without a summary.
//
// When you add a new page, set `llm:` MANUALLY in the page's frontmatter to
// give AI agents a useful hint about what the page covers. Keep it terse and
// describe the actual API/pattern shown - e.g.
//   ---
//   llm: "Server-side hooks (validation, saving, saved, deleting, deleted) for custom logic at persistence boundaries."
//   ---
// Auto-generated API reference pages (ref_*.md) are intentionally excluded.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sidebar, tutorials } from '../.vitepress/sidebar.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const docsRoot = resolve(__dirname, '..')

const SITE = 'https://remult.dev'
const LEARN_SITE = 'https://learn.remult.dev'

const linkToFile = (link) => {
	const clean = link.split('#')[0].split('?')[0]
	const noLead = clean.startsWith('/') ? clean.slice(1) : clean
	return join(docsRoot, noLead.endsWith('/') ? `${noLead}index.md` : `${noLead}.md`)
}

const parseFrontmatter = (raw) => {
	const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
	if (!m) return {}
	const fm = {}
	for (const line of m[1].split(/\r?\n/)) {
		const kv = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/)
		if (!kv) continue
		let v = kv[2].trim()
		// Strip inline YAML comments on bare values only; quoted strings own
		// everything between their quotes.
		if (!v.startsWith('"') && !v.startsWith("'")) v = v.replace(/\s+#.*$/, '').trim()
		// Parse YAML literals so `llm: false` is a real boolean, not the string "false".
		if (v === 'false') fm[kv[1]] = false
		else if (v === 'true') fm[kv[1]] = true
		else fm[kv[1]] = v.replace(/^['"](.*)['"]$/, '$1')
	}
	return fm
}

const readFrontmatter = (file) => {
	try {
		return parseFrontmatter(readFileSync(file, 'utf8'))
	} catch {
		return null // file missing - signals to caller to skip
	}
}

const isRefPage = (link) => /\/ref_[^/]+\/?$/.test(link)

const capitalize = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s)

const entry = (text, link) => {
	const fm = readFrontmatter(linkToFile(link))
	if (fm == null) return null
	// Pages can opt out of the index with `llm: false` in frontmatter.
	if (fm.llm === false) return null
	const title = fm.title || text || link
	const url = `${SITE}${link}`
	// Ref pages are auto-generated API docs - the title is the symbol name,
	// no summary is needed.
	if (isRefPage(link)) return `- [${title}](${url})`
	return fm.llm ? `- [${title}](${url}): ${fm.llm}` : `- [${title}](${url})`
}

const walk = (items, out) => {
	for (const item of items ?? []) {
		if (item.link) {
			const line = entry(item.text, item.link)
			if (line) out.push(line)
		}
		if (item.items) walk(item.items, out)
	}
}

const sections = []

// Main docs - one ### per top-level sidebar group
sections.push('## Documentation')
for (const group of sidebar['/docs/']) {
	const lines = []
	if (group.link) {
		const line = entry(group.text, group.link)
		if (line) lines.push(line)
	}
	walk(group.items, lines)
	if (lines.length === 0) continue
	sections.push('')
	sections.push(`### ${group.text}`)
	sections.push(...lines)
}

// Tutorials - one canonical (React), pointers for the rest.
const tutorialName = (t) => capitalize(t.title ?? t.path)
const CANONICAL = 'react'
sections.push('')
sections.push('## Tutorials')
sections.push('')
sections.push(
	'Each framework tutorial walks through the same 10 lessons (Setup, Entities, Paging/Sorting/Filtering, CRUD, Validation, Live Queries, Backend methods, Auth, Database, Deployment) with framework-specific code samples.',
)
const canonical = tutorials.find((t) => t.path === CANONICAL)
if (canonical) {
	const root = sidebar[`/tutorials/${canonical.path}/`][0]
	const lines = []
	walk(root.items, lines)
	if (lines.length) {
		sections.push('')
		sections.push(`### ${tutorialName(canonical)} Tutorial (canonical)`)
		sections.push(...lines)
	}
}
sections.push('')
sections.push('### Same tutorial, other frameworks')
for (const t of tutorials) {
	if (t.path === CANONICAL) continue
	const url = `${SITE}/tutorials/${t.path}/`
	sections.push(
		`- [${tutorialName(t)} Tutorial](${url}): Same 10-lesson structure as the React tutorial above, with ${tutorialName(t)}-specific code samples.`,
	)
}

// Interactive Tutorial - walk docs/interactive/src/content/tutorial
const interactiveRoot = join(docsRoot, 'interactive/src/content/tutorial')
const sortedDirs = (dir) =>
	readdirSync(dir, { withFileTypes: true })
		.filter((e) => e.isDirectory())
		.map((e) => e.name)
		.sort()

const metaTitle = (dir) => {
	try {
		return parseFrontmatter(readFileSync(join(dir, 'meta.md'), 'utf8')).title || null
	} catch {
		return null
	}
}

try {
	const parts = sortedDirs(interactiveRoot)
	if (parts.length) {
		sections.push('')
		sections.push('## Interactive Tutorial')
		sections.push('')
		sections.push(`Hands-on, browser-based tutorial at ${LEARN_SITE}.`)
		for (const part of parts) {
			const partDir = join(interactiveRoot, part)
			const partTitle = metaTitle(partDir) ?? part
			const chapters = []
			for (const chapter of sortedDirs(partDir)) {
				const chapterDir = join(partDir, chapter)
				const chapterTitle = metaTitle(chapterDir) ?? chapter
				const lines = []
				for (const lesson of sortedDirs(chapterDir)) {
					const file = join(chapterDir, lesson, 'content.md')
					const fm = readFrontmatter(file)
					if (fm == null) continue
					if (fm.llm === false) continue
					const url = `${LEARN_SITE}/${part}/${chapter}/${lesson}`
					const linkText = fm.title ?? lesson
					lines.push(fm.llm ? `- [${linkText}](${url}): ${fm.llm}` : `- [${linkText}](${url})`)
				}
				if (lines.length) chapters.push({ title: chapterTitle, lines })
			}
			if (chapters.length === 0) continue
			sections.push('')
			sections.push(`### ${partTitle}`)
			for (const { title, lines } of chapters) {
				sections.push('')
				sections.push(`#### ${title}`)
				sections.push(...lines)
			}
		}
	}
} catch (e) {
	console.warn(`! skipping interactive tutorial (${e.message})`)
}

// Agent Skill
sections.push('')
sections.push('## Agent Skill')
sections.push(
	`- [Remult Skill](${SITE}/.well-known/agent-skills/remult/SKILL.md): Install with \`npx skills add ${SITE}\` so AI agents (Claude Code, Cursor, ...) know Remult conventions - @Entity, repo(), lifecycle hooks, permissions, ValueList enums, the dual-entity pattern.`,
)

const header = `# Remult

> Remult is a TypeScript library for building full-stack apps without boilerplate. Define entities once and use them on the frontend, the backend, and in the database, with a single SSOT (Single Source of Truth) for schema, validation, permissions, and CRUD.

## Core Concepts

- **Entity** - a TypeScript class decorated with \`@Entity('key', options)\` is your SSOT: schema, REST API, validation, permissions, and lifecycle in one place.
- **Fields** - \`@Fields.string()\`, \`.number()\`, \`.boolean()\`, \`.date()\`, \`.json()\`, \`.uuid()\`, \`.cuid()\`, \`.autoIncrement()\`, plus \`@Relations.toOne()\` / \`.toMany()\` for entity links.
- **Repository (\`repo(Entity)\`)** - universal CRUD: \`.find()\`, \`.findFirst()\`, \`.findId()\`, \`.insert()\`, \`.update()\`, \`.delete()\`, \`.save()\`, \`.count()\`, \`.query()\`, \`.liveQuery()\`. Same API on frontend and backend.
- **Permissions** - entity-level \`allowApiRead/Insert/Update/Delete/Crud\` and per-field \`allowApiUpdate\`; values are boolean, role string, role array, or \`(entity, remult) => boolean\`. Use \`apiPrefilter\` / \`backendPrefilter\` for row-level filtering.
- **Lifecycle hooks** - \`validation\`, \`saving\`, \`saved\`, \`deleting\`, \`deleted\` run on the server before/after persistence; \`saving\` mutates the entity in place.
- **BackendMethod** - \`@BackendMethod({ allowed })\` exposes a server-only function callable from the client; runs in the server context with \`remult.user\` populated.
- **Live queries** - \`repo(X).liveQuery(options).subscribe(({ items, changes }) => ...)\` pushes inserts/updates/deletes to all connected clients over SSE.
- **Custom filters** - \`Filter.createCustom\` / \`SqlDatabase.filterToRaw\` to express complex queries that round-trip to the server safely.
- **Validators** - built-ins under \`Validators.*\` (\`required\`, \`min\`, \`max\`, \`email\`, \`url\`, \`unique\`, \`regex\`, \`enum\`, ...) or \`validate: (entity) => string | undefined\` for custom logic.
- **Admin UI** - turnkey \`/api/admin\` panel via \`admin: true\` (or \`admin: { allow: 'admin' }\`) in \`remultApi()\`.
- **Stacks** - frameworks: React, Angular, Vue, SvelteKit, Next.js, SolidStart, Nuxt. Servers: Express, Fastify, Hono, Elysia, Hapi, Koa, NestJS. Databases: PostgreSQL, MySQL, MongoDB, SQLite (better/sqljs/bun), MSSQL, Turso, DuckDB, Oracle, Cloudflare D1, JSON files.

`

const out = header + sections.join('\n') + '\n'
writeFileSync(join(docsRoot, 'public/llms.txt'), out)

const lineCount = out.split('\n').length
console.info(`✔ wrote docs/public/llms.txt (${lineCount} lines)`)
