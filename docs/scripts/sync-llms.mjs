// Generates docs/public/llms.txt - a curated llms.txt index of every doc page
// with a one-line summary, so an agent can pick what to fetch.
// See: https://llmstxt.org/

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sidebar } from '../.vitepress/sidebar.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const docsRoot = resolve(__dirname, '..')

const SITE = 'https://remult.dev'
const LEARN_SITE = 'https://learn.remult.dev'
const SUMMARY_MAX = 180

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

const truncate = (s) => {
	if (s.length <= SUMMARY_MAX) return s
	const cut = s.slice(0, SUMMARY_MAX)
	const lastSpace = cut.lastIndexOf(' ')
	return (lastSpace > 60 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:!?\s]+$/, '') + '...'
}

const isProseLine = (line) => {
	const t = line.trim()
	if (!t) return false
	if (/^[#>|`:+\-*]/.test(t)) return false // headings, blockquote, lists, code-fence, admonition
	if (t.startsWith('<') || t.startsWith('```')) return false
	if (t.startsWith('---')) return false
	if (/^\*+\s*\*\*[^*]+\*\*\s*$/.test(t)) return false // `* **Name**` ref-doc rows
	return true
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
	const cleaned = body
		.replace(/<script[\s\S]*?<\/script>/gi, '')
		.replace(/<style[\s\S]*?<\/style>/gi, '')

	const h1 = cleaned.match(/^#\s+(.+)$/m)
	const title = fm.title || (h1 ? cleanInline(h1[1]) : null)

	const after = h1 ? cleaned.slice(cleaned.indexOf(h1[0]) + h1[0].length) : cleaned

	// Find the first prose line, then keep gathering consecutive prose lines
	// from the same paragraph for a richer one-liner.
	const lines = after.split(/\r?\n/)
	const collected = []
	for (const line of lines) {
		if (isProseLine(line)) {
			collected.push(line.trim())
		} else if (collected.length) {
			break
		}
	}

	let summary = collected.length ? cleanInline(collected.join(' ')) : null
	// Drop placeholder ref-doc labels like "Arguments:" with no real prose after.
	if (summary && /^[A-Z][A-Za-z]+:$/.test(summary)) summary = null
	return { title, summary: summary ? truncate(summary) : null, missing: false }
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

// Tutorials - one ## per framework (10 lessons each)
const tutorialKeys = Object.keys(sidebar)
	.filter((k) => k.startsWith('/tutorials/'))
	.sort()
sections.push('')
sections.push('## Tutorials')
for (const key of tutorialKeys) {
	const root = sidebar[key][0]
	const lines = []
	walk(root.items, lines)
	if (lines.length === 0) continue
	sections.push('')
	sections.push(`### ${capitalize(root.title)} Tutorial`)
	sections.push(...lines)
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

`

const out = header + sections.join('\n') + '\n'
writeFileSync(join(docsRoot, 'public/llms.txt'), out)

const lineCount = out.split('\n').length
console.info(`✔ wrote docs/public/llms.txt (${lineCount} lines)`)
