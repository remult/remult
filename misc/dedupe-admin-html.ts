// After the dual CJS + ESM build, `get-remult-admin-html.js` is emitted twice
// (once in `dist/remult/server/` and once in `dist/remult/esm/server/`), with
// the full ~1.4MB admin HTML inlined in both copies.
//
// The two copies are functionally identical, so we keep the CJS copy as the
// single source of truth and replace the ESM copy with a tiny re-export shim.
// Node's ESM loader handles importing named exports from CJS via
// cjs-module-lexer, and bundlers (esbuild/rollup/webpack/vite) follow the
// relative path across the package without issue.
//
// Result: ~1.4MB shaved from the published tarball (unpacked) with zero API
// change and no runtime asset loading.
import * as fs from 'fs'
import * as path from 'path'

const cjsFile = path.join(
  'dist',
  'remult',
  'server',
  'get-remult-admin-html.js',
)
const esmFile = path.join(
  'dist',
  'remult',
  'esm',
  'server',
  'get-remult-admin-html.js',
)

if (!fs.existsSync(cjsFile)) {
  throw new Error(`[dedupe-admin-html] expected CJS file at ${cjsFile}`)
}
if (!fs.existsSync(esmFile)) {
  throw new Error(`[dedupe-admin-html] expected ESM file at ${esmFile}`)
}

const cjsSize = fs.statSync(cjsFile).size
const esmSize = fs.statSync(esmFile).size

const shim = `// Shim: re-export from the single canonical CJS copy so the ~1.4MB admin
// HTML is not duplicated between the CJS and ESM builds.
export { getHtml } from '../../server/get-remult-admin-html.js'
`

fs.writeFileSync(esmFile, shim, 'utf8')

const saved = esmSize - Buffer.byteLength(shim, 'utf8')
console.log(
  `[dedupe-admin-html] replaced ESM copy (${(esmSize / 1024).toFixed(
    0,
  )} KB) with shim, keeping CJS copy (${(cjsSize / 1024).toFixed(
    0,
  )} KB). Saved ~${(saved / 1024).toFixed(0)} KB.`,
)
