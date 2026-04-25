// Copies skills from `.claude/skills/*` into `docs/public/.well-known/agent-skills/`
// so `npx skills add https://remult.dev` can discover them.
// See: https://github.com/vercel-labs/skills (well-known provider)

import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '../..')
const skillsSrc = join(repoRoot, '.claude/skills')
const wellKnownDst = join(repoRoot, 'docs/public/.well-known/agent-skills')

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/
const DESCRIPTION_RE = /^description:\s*(.*)$/m

rmSync(wellKnownDst, { recursive: true, force: true })
mkdirSync(wellKnownDst, { recursive: true })

const entries = readdirSync(skillsSrc, { withFileTypes: true }).filter((e) => e.isDirectory())

const skills = entries.map((entry) => {
	const srcDir = join(skillsSrc, entry.name)
	const dstDir = join(wellKnownDst, entry.name)
	cpSync(srcDir, dstDir, { recursive: true })

	const files = readdirSync(srcDir, { recursive: true, withFileTypes: true })
		.filter((f) => f.isFile())
		.map((f) =>
			join(f.parentPath ?? f.path, f.name)
				.slice(srcDir.length + 1)
				.replaceAll('\\', '/'),
		)

	const skillMd = readFileSync(join(srcDir, 'SKILL.md'), 'utf8')
	const fm = skillMd.match(FRONTMATTER_RE)?.[1] ?? ''
	const description = fm.match(DESCRIPTION_RE)?.[1]?.trim() ?? ''

	return { name: entry.name, description, files }
})

writeFileSync(join(wellKnownDst, 'index.json'), JSON.stringify({ skills }, null, 2) + '\n')

console.info(`✔ synced ${skills.length} skill(s) to ${wellKnownDst}`)
