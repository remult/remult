import * as fs from 'fs'

var api: {
  children: member[]
} = JSON.parse(fs.readFileSync('./dist/generate/the.json').toString())
{
  const z: member = JSON.parse(JSON.stringify(findType('FindFirstOptions')))
  z.name = 'FindFirstOptionsBase'
  z.children = z.children.filter(
    (m) => m.inheritedFrom?.name.startsWith(z.name),
  )
  api.children[0].children.push(z)
}

class DocFile {
  s: string = ''
  constructor(private fileName: string) {}
  addTitle(name: string) {
    this.s += '# ' + name + '\n'
  }
  writeMemberComments(m: member, indent = 0) {
    if (!m.comment) {
      switch (m.name) {
        case 'where':
          m.comment = {
            shortText: 'filters the data',
            tags: [
              {
                tag: 'see',
                text: '[EntityFilter](http://remult.dev/docs/entityFilter.html)',
              },
            ],
          }
          break
      }
    }
    if (!m.comment?.shortText) {
      this.writeLine('* **' + m.name + '**', indent)
      return
    }

    if (m.comment.shortText) {
      if (indent == 0 && m.kindString != 'Parameter')
        this.writeLine(m.comment.shortText, indent)
      else
        this.writeLine('* **' + m.name + '** - ' + m.comment.shortText, indent)
    }
    if (m.name == 'Entity') {
    }
    if (m.comment.tags) {
      let lastExample: Tag = undefined
      let tags: Tag[] = []
      for (const t of m.comment.tags) {
        if (t.tag == 'example') {
          lastExample = t
        }
        if (t.tag.startsWith('entity') || t.tag.startsWith('field')) {
          if (t.text.startsWith('\n   ')) lastExample.text += '\n   '
          else lastExample.text += '\n'
          lastExample.text +=
            '@' + t.tag[0].toUpperCase() + t.tag.substring(1) + t.text
          continue
        }
        tags.push(t)
      }

      for (const t of tags) {
        this.writeLine('\n\n*' + t.tag + '*', indent + 1)
        let text = t.text
        if (t.tag == 'example') {
          if (!text.endsWith('\n')) text += '\n'
          text = '```ts' + text + '```\n'
        }

        this.writeLine(text, indent + 1)
      }
    }
  }
  writeLine(what: string, indent: number) {
    let space = ''
    for (let index = 0; index < indent; index++) {
      space += '   '
    }
    this.s += space + what.replace(/\n/g, '\n' + space) + '\n'
  }
  writeMembers(type: member, indent = 0) {
    if (type.children) {
      try {
        if (type.name === 'Repository')
          type.children.sort((a, b) => a.id - b.id)
        else type.children.sort((a, b) => a.sources[0].line - b.sources[0].line)
        const itemsWithComment = type.children.filter(
          (x) => x.comment || x.signatures?.filter((s) => s.comment),
        )
        type.children = [
          ...itemsWithComment,
          ...type.children.filter((x) => !itemsWithComment.includes(x)),
        ]
      } catch {}
      if (type.name === 'Repository' && false)
        console.table(
          type.children.map((c) => ({
            name: c.name,
            id: c.id,
            line: c.sources && c.sources[0]?.line,
            comment: !!(c.comment || c.signatures?.filter((s) => s.comment)),
          })),
        )

      for (const m of type.children) {
        if (m.flags.isPrivate) continue
        if (m.name == 'repCache') continue
        if (indent == 0) this.writeLine(header(indent + 2, m.name), indent)
        if (!m.signatures) this.writeMemberComments(m, indent)
        if (m.signatures) {
          for (const s of m.signatures) {
            this.writeMemberComments(s, indent)
            {
              if (
                s.parameters &&
                indent ==
                  0 /* to prevent the parameters of load, in find options etc... */
              ) {
                this.writeLine('', indent)
                this.writeLine('Arguments:', indent)
                for (const p of s.parameters) {
                  this.writeMemberComments(p, indent)
                  if (p.comment?.text)
                    this.writeLine(' - ' + p.comment?.text, indent + 1)
                  if (p.type.type == 'union') {
                    for (const pp of p.type.types) {
                      if (pp.name)
                        if (pp.name.includes('Options')) {
                          let o = findType(pp.name)
                          this.writeMembers(o, indent + 1)
                        }
                    }
                  } else if (p.type.name)
                    if (p.type.name.includes('Options')) {
                      let o = findType(p.type.name)
                      this.writeMembers(o, indent + 1)
                    }
                }
              }
            }
            break
          }
        }
      }
    }
  }
  writeFile() {
    fs.writeFileSync(
      './docs/docs/ref_' + this.fileName.toLowerCase() + '.md',
      this.s,
    )
  }
}

function findType(type: string) {
  let r = api.children[0].children.find((e) => e.name == type)
  if (!r) r = api.children[1].children.find((e) => e.name == type)
  if (!r) {
    throw new Error("Couldn't find type " + type)
  }
  return r
}

try {
  for (const pairs of [
    ['Entity', 'EntityOptions'],
    ['Field', 'FieldOptions'],
    ['BackendMethod', 'BackendMethodOptions'],
  ]) {
    if (!pairs) continue
    let type = findType(pairs[0])
    let options = findType(pairs[1])
    let f = new DocFile(type.name)
    f.addTitle(type.name)
    f.writeMemberComments(type.signatures[0])
    f.writeMembers(options)
    f.writeFile()
  }

  for (const typeName of [
    'Remult',
    'Repository',
    'QueryResult',
    'Paginator',
    'EntityMetadata',
    'FieldMetadata',
    'RemultServerOptions',
  ]) {
    let type = findType(typeName)

    let f = new DocFile(type.name)
    f.addTitle(type.name)
    f.writeMemberComments(type)
    f.writeMembers(type)
    f.writeFile()
  }
} catch (err) {
  console.error(err)
  for (const line of err.stack.split('\n')) {
    console.error(line)
  }
}

type Tag = {
  tag: string
  text: string
}

interface member {
  kindString: 'Parameter'
  name: string
  parameters: ({
    name: string
    type: {
      name: string
      type: string
      types: { name: string }[]
    }
  } & member)[]
  signatures: member[]
  sources: { line: number }[]
  flags: {
    isPrivate: boolean
    isStatic: boolean
  }
  id: number
  children: member[]
  comment: {
    shortText?: string
    text?: string
    tags: Tag[]
  }
  inheritedFrom: {
    type: string
    name: string
  }
}

function header(depth: number, text: string) {
  let s = ''
  for (let index = 0; index < depth; index++) {
    s += '#'
  }
  return s + ' ' + text
}
