import fs from 'fs'

const html = fs.readFileSync('tmp/index.html', 'utf8')

fs.writeFileSync(
  '../core/server/get-remult-admin-html.ts',
  `export function getHtml(){
  return ${JSON.stringify(html)}
}`,
  'utf8',
)
