// Generates docs/public/llms.txt - a curated llms.txt index of every doc page
// with a one-line summary, so an agent can pick what to fetch.
// See: https://llmstxt.org/

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sidebar, tutorials } from '../.vitepress/sidebar.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const docsRoot = resolve(__dirname, '..')

const SITE = 'https://remult.dev'
const LEARN_SITE = 'https://learn.remult.dev'
// Soft cap - if a single sentence runs longer than this, hard-truncate with `...`.
// First-sentence extraction usually keeps us well under this in practice.
const SUMMARY_HARD_CAP = 350

const linkToFile = (link) => {
	const clean = link.split('#')[0].split('?')[0]
	const noLead = clean.startsWith('/') ? clean.slice(1) : clean
	return join(docsRoot, noLead.endsWith('/') ? `${noLead}index.md` : `${noLead}.md`)
}

const cleanInline = (s) =>
	s
		.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
		.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
		.replace(/`([^`]+)`/g, '$1')
		.replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
		.replace(/\s+/g, ' ')
		.trim()

// Keep just the first sentence of a paragraph. A sentence ends on `.`, `!`, or
// `?` followed by whitespace (or end of string). Decimal numbers, abbreviations
// like "e.g." and version refs like "v3.3" are avoided by requiring a space or
// newline after the punctuation - the regex's last char must be \s or absent.
const firstSentence = (s) => {
	// Match up to and including the first sentence terminator that's followed by
	// whitespace + an uppercase/digit (the next sentence), or end of string.
	const m = s.match(/^[\s\S]*?[.!?](?=\s+[A-Z0-9“"'(]|\s*$)/)
	return (m ? m[0] : s).trim()
}

const capSummary = (s) => {
	if (s.length <= SUMMARY_HARD_CAP) return s
	const cut = s.slice(0, SUMMARY_HARD_CAP)
	const lastSpace = cut.lastIndexOf(' ')
	return (lastSpace > 80 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:!?\s]+$/, '') + '...'
}

const isProseLine = (line) => {
	const t = line.trim()
	if (!t) return false
	if (/^[#>|`:+\-*]/.test(t)) return false // headings, blockquote, lists, code-fence, admonition
	if (t.startsWith('<') || t.startsWith('```')) return false
	if (t.startsWith('---')) return false
	if (/^\*+\s*\*\*[^*]+\*\*\s*$/.test(t)) return false // `* **Name**` ref-doc rows
	if (/^\d+\.\s/.test(t)) return false // numbered list step (e.g. "1. Create a main.ts file...")
	return true
}

// Filler text that frequently appears as the first paragraph but tells the agent
// nothing about the page itself - skip and try the next paragraph instead.
// `.?s` matches both straight (') and smart (’) apostrophes in "Here's", etc.
const BOILERPLATE_PATTERNS = [
	/^Looking to get hands-on/i,
	/^Here.?s the polished version/i,
	/^Here.?s how to configure/i,
	/^Want to use [\w. ]+\?\s*Check out this video/i,
	/^To set up (?:a new|your) /i,
	/^To create a new /i,
	/^To use [\w. ]+ as (?:the|a) /i,
	/^To enable [\w. ]+ as /i,
	/^To add (?:graphql|swagger) /i,
	/^Run the following commands? to /i,
	/^Run the server with/i,
	/^Install [\w-]+ (?:and [\w-]+ )?to enable/i,
	/^Install the latest version of Remult/i,
	/^Install Remult in your /i,
	/^During the setup, answer/i,
	/^When prompted, use these answers/i,
	/^In your (?:api|index|server)\.[jt]sx?\b/i,
	/^In your index\.ts or whichever server/i,
	/^If you.?re already using a knex/i,
	/^Once the setup is complete/i,
	/^Afterward, navigate into/i,
	/^Answer the prompts as follows/i,
	/^Install knex and /i,
	/^If you have an existing knex/i,
	/^You can store data in JSON files using Remult/i,
]
const isBoilerplate = (p) => BOILERPLATE_PATTERNS.some((re) => re.test(p))

// Strip block-level constructs whose contents aren't useful summary prose:
//  - `::: type ... :::` admonitions (interactive-tutorial promos, callouts)
//  - fenced code blocks (```...```) - raw install commands and code samples
const stripBlocks = (text) => {
	const lines = text.split(/\r?\n/)
	const out = []
	let admonition = 0
	let inFence = false
	for (const line of lines) {
		const t = line.trim()
		if (t.startsWith('```')) {
			inFence = !inFence
			continue
		}
		if (inFence) continue
		if (/^:::\s*\w/.test(t)) {
			admonition++
			continue
		}
		if (/^:::\s*$/.test(t)) {
			if (admonition > 0) admonition--
			continue
		}
		if (admonition === 0) out.push(line)
	}
	return out.join('\n')
}

const parseFrontmatter = (raw) => {
	const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
	if (!m) return { fm: {}, body: raw }
	const fm = {}
	for (const line of m[1].split(/\r?\n/)) {
		const kv = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/)
		if (kv) fm[kv[1]] = kv[2].trim().replace(/^['"](.*)['"]$/, '$1')
	}
	return { fm, body: raw.slice(m[0].length) }
}

const summarizeFile = (file) => {
	let raw
	try {
		raw = readFileSync(file, 'utf8')
	} catch {
		return { title: null, summary: null, missing: true }
	}

	const { fm, body } = parseFrontmatter(raw)
	const cleaned = stripBlocks(
		body
			.replace(/<script[\s\S]*?<\/script>/gi, '')
			.replace(/<style[\s\S]*?<\/style>/gi, ''),
	)

	const h1 = cleaned.match(/^#\s+(.+)$/m)
	const title = fm.title || (h1 ? cleanInline(h1[1]) : null)

	const after = h1 ? cleaned.slice(cleaned.indexOf(h1[0]) + h1[0].length) : cleaned

	// Gather contiguous prose paragraphs - blank line splits paragraphs,
	// non-prose lines (headings, lists, code fences) end the current paragraph.
	const paragraphs = []
	let current = []
	const flush = () => {
		if (current.length) paragraphs.push(current.join(' '))
		current = []
	}
	for (const line of after.split(/\r?\n/)) {
		if (line.trim() === '') {
			flush()
		} else if (isProseLine(line)) {
			current.push(line.trim())
		} else {
			flush()
		}
	}
	flush()

	// Pick first paragraph that isn't boilerplate or a stub ref-doc label.
	let summary = null
	for (const p of paragraphs) {
		const cleanP = cleanInline(p)
		if (!cleanP) continue
		if (isBoilerplate(cleanP)) continue
		if (/^[A-Z][A-Za-z]+:$/.test(cleanP)) continue
		summary = cleanP
		break
	}
	return { title, summary: summary ? capSummary(firstSentence(summary)) : null, missing: false }
}

const summarize = (link) => summarizeFile(linkToFile(link))

const capitalize = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s)

const itemEntry = (item, fallbackTitle = null) => {
	if (!item.link) return null
	const { title, summary, missing } = summarize(item.link)
	const displayTitle = title || item.text || fallbackTitle || item.link
	const url = `${SITE}${item.link}`
	const tail = missing ? '' : summary ? `: ${summary}` : ''
	return `- [${displayTitle}](${url})${tail}`
}

const walk = (items, out) => {
	for (const item of items ?? []) {
		const line = itemEntry(item)
		if (line) out.push(line)
		if (item.items) walk(item.items, out)
	}
}

const sections = []

// Main docs - one ## per top-level sidebar group
sections.push('## Documentation')
for (const group of sidebar['/docs/']) {
	const lines = []
	if (group.link) {
		const line = itemEntry(group, group.text)
		if (line) lines.push(line)
	}
	walk(group.items, lines)
	if (lines.length === 0) continue
	sections.push('')
	sections.push(`### ${group.text}`)
	sections.push(...lines)
}

// Tutorials - same 10-lesson structure for every framework. List one
// canonical (React) in full; the rest get a single pointer line to keep
// the index focused on what's actually different.
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

// Interactive Tutorial (learn.remult.dev) - walk docs/interactive/src/content/tutorial
const interactiveRoot = join(docsRoot, 'interactive/src/content/tutorial')
const sortedDirs = (dir) =>
	readdirSync(dir, { withFileTypes: true })
		.filter((e) => e.isDirectory())
		.map((e) => e.name)
		.sort()

const metaTitle = (dir) => {
	const { fm } = parseFrontmatter(readFileSync(join(dir, 'meta.md'), 'utf8'))
	return fm.title || null
}

try {
	const parts = sortedDirs(interactiveRoot)
	if (parts.length) {
		sections.push('')
		sections.push('## Interactive Tutorial')
		sections.push(`> Hands-on, browser-based tutorial at ${LEARN_SITE}`)
		for (const part of parts) {
			const partDir = join(interactiveRoot, part)
			const partTitle = metaTitle(partDir) ?? part
			const lines = []
			for (const chapter of sortedDirs(partDir)) {
				const chapterDir = join(partDir, chapter)
				const chapterTitle = metaTitle(chapterDir) ?? chapter
				for (const lesson of sortedDirs(chapterDir)) {
					const contentFile = join(chapterDir, lesson, 'content.md')
					const { title, summary, missing } = summarizeFile(contentFile)
					if (missing) continue
					const url = `${LEARN_SITE}/${part}/${chapter}/${lesson}`
					const linkText = `${chapterTitle} - ${title ?? lesson}`
					lines.push(`- [${linkText}](${url})${summary ? `: ${summary}` : ''}`)
				}
			}
			if (lines.length === 0) continue
			sections.push('')
			sections.push(`### ${partTitle}`)
			sections.push(...lines)
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
