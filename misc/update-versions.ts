import * as fs from 'fs'
var root: packageJson = JSON.parse(fs.readFileSync('./package.json').toString())
updateVersion('./dist/remult')
//updateVersion('./dist/angular');

function updateVersion(path: string) {
  var p: packageJson = JSON.parse(
    fs.readFileSync(path + '/package.json').toString(),
  )
  p.version = root.version
  fs.writeFileSync(path + '/package.json', JSON.stringify(p, null, 4))
}

interface packageJson {
  version: string
}
