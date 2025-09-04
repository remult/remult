import fs from 'fs'

const html = fs.readFileSync('tmp/index.html', 'utf8')

function escapeForTemplateLiteral(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')
}

fs.writeFileSync(
  '../core/server/get-remult-admin-html.ts',
  `export function getHtml(){
  return \`${escapeForTemplateLiteral(html)}\`
}`,
  'utf8',
)
