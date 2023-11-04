import fs from 'fs'

for (let folder of ['react', 'angular', 'react-next', 'vue']) {
  for (let file of ['live-queries', 'crud']) {
    const fileName = `docs/tutorials/${folder}/${file}.md`
    const text = fs
      .readFileSync(fileName)
      .toString()
      .replace(/catch \(error\)/g, 'catch (error: any)')
    fs.writeFileSync(fileName, text)
  }
}
