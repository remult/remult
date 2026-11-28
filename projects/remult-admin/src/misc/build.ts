import fs from 'fs'

const REGEX_BACKSLASH = /\\/g
const REGEX_BACKTICK = /`/g
const REGEX_DOLLAR = /\$/g

const html = fs.readFileSync('build/index.html', 'utf8')

function escapeForTemplateLiteral(str: string): string {
  return str
    .replace(REGEX_BACKSLASH, '\\\\')
    .replace(REGEX_BACKTICK, '\\`')
    .replace(REGEX_DOLLAR, '\\$')
}

fs.writeFileSync(
  '../core/server/get-remult-admin-html.ts',
  `export function getHtml(){
  return \`${escapeForTemplateLiteral(html)}\`
}`,
  'utf8',
)
