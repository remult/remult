import * as fs from 'fs'
import type { PackageJson } from 'type-fest'
import source from '../projects/core/package.json'

const pkg = source as PackageJson
pkg.main = "./cjs/index.js"
pkg.module = "./esm/index.js"
pkg.types = "./esm/index.d.ts"

let exps = {} as any
for (const key in source.exports) {
    Object.assign(exps, exps, {
        [key]: {
            "require": (source.exports[key] as string).replace('./', './cjs/'),
            "import": (source.exports[key] as string).replace('./', './esm/'),
            "types": (source.exports[key] as string).replace('./', './esm/').replace('.js', '.d.ts'),
        }
    })
}

pkg.exports = exps

fs.writeFileSync('./dist/remult/package.json', JSON.stringify(pkg, null, 4))
