import * as fs from 'fs'
import { execSync } from 'child_process'
const exclude = [
  'repCache',
  'throwErrorIfFilterIsEmpty',
  'isFilterEmpty',
  'translateCustomWhere',
  '__applyToConsumer',
  '_getSourceSql',
  'provideMigrationBuilder',
]

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

// Track all generated files for batch prettier formatting
const generatedFiles: string[] = []

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
            summary: [{ kind: 'text', text: 'filters the data' }],
            blockTags: [
              {
                tag: 'see',
                content: [
                  {
                    kind: 'text',
                    text: '[EntityFilter](http://remult.dev/docs/entityFilter.html)',
                  },
                ],
              },
            ],
          }
          break
      }
    }
    let shortText = m.comment?.summary?.length
      ? m.comment.summary.map((x) => x.text).join('')
      : undefined
    if (!shortText) {
      if (m.name === '__type') return
      this.writeLine('* **' + m.name + '**', indent)
      return
    }

    if (shortText) {
      if (indent == 0 && m.variant != 'param') this.writeLine(shortText, indent)
      else this.writeLine('* **' + m.name + '** - ' + shortText, indent)
    }
    if (m.name == 'Entity') {
    }

    if (m.comment.blockTags)
      for (const t of m.comment?.blockTags) {
        if (t.tag.startsWith('@')) t.tag = t.tag.substring(1)
        this.writeLine('\n\n#### ' + t.tag + ':', indent)

        let text = t.content
          .map((x) => {
            if (x.kind === 'inline-tag' && x.tag === '@link') {
              const [p1, p2] = x.text.split(/[.#]/)
              const file = p1
                .toLowerCase()
                .replace('relationoptions', 'relations')
                .replace('options', '')
              return `[${x.text}](/docs/ref_${file.toLowerCase()}${
                p2 ? `#${p2.toLowerCase()}` : ''
              })`
            }
            return x.text
          })
          .join('')

        this.writeLine(text, indent)
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
    if (!type.children) {
      if (type.type?.type == 'intersection') {
        type.children = type.type.types
          .map((t) => t.declaration?.children)
          .filter((x) => x != undefined)
          .reduce((a, b) => a!.concat(b!), [])!
      }
    }
    if (type.children) {
      try {
        if (type.name === 'Repository')
          type.children.sort((a, b) => a.id - b.id)
        else type.children.sort((a, b) => a.sources[0].line - b.sources[0].line)
        for (const child of type.children) {
          if (!child.comment) {
            const sig = child.type?.declaration?.signatures?.[0]
            if (sig) {
              child.comment = sig.comment
              child.signatures = child.type?.declaration?.signatures!
            }
          }
        }
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
        if (exclude.includes(m.name)) continue
        if (indent == 0) this.writeLine(header(indent + 2, m.name), indent)

        this.writeMemberSignatures(m, indent)
      }
    }
  }
  writeMemberSignatures(m: member, indent: number) {
    if (!m.signatures) this.writeMemberComments(m, indent)
    else if (m.signatures) {
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
              } else if (p.type.type == 'reflection') {
                this.writeMembers(p.type.declaration!, indent + 1)
              } else if (p.type.name)
                if (
                  p.type.name.includes('Options') &&
                  !p.type.refersToTypeParameter
                ) {
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

  writeFile() {
    const filePath = './docs/docs/ref_' + this.fileName.toLowerCase() + '.md'
    fs.writeFileSync(
      filePath,
      this.s, //.replace(/\n/g, '\r\n'),
    )

    // Add to the list of files to be prettified later
    generatedFiles.push(filePath)
  }
}

function findType(type: string) {
  for (const c of api.children) {
    let r = c.children.find((e) => e.name == type)
    if (r) return r
  }
  throw new Error("Couldn't find type " + type)
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
    'Validators',
    'ValueConverter',
    'Relations',
    'RelationOptions',
    'Remult',
    'ApiClient',
    'Repository',
    'RemultServerOptions',
    'EntityMetadata',
    'FieldMetadata',
    'QueryResult',
    'Paginator',
    'LiveQuery',
    'LiveQueryChangeInfo',
    'Filter',
    'Sort',
    'SubscriptionChannel',
    'generateMigrations',
    'migrate',

    'FilterPreciseValues',
    'EntityRef',
    'FieldRef',
    'EntityBase',
    'IdEntity',
    'getEntityRef',
    'getFields',
    'SqlDatabase',
    'initAsyncHooks',

    //    'PreprocessFilterEvent',
  ]) {
    let type = findType(typeName)

    let f = new DocFile(type.name)
    f.addTitle(type.name)
    //    f.writeMemberComments(type)
    f.writeMemberSignatures(type, 0)
    f.writeMembers(type)
    f.writeFile()
  }
} catch (err: any) {
  console.error(err)
  for (const line of err.stack.split('\n')) {
    console.error(line)
  }
}

// Run prettier on all generated files at once
if (generatedFiles.length > 0) {
  try {
    console.log(`\nRunning prettier on ${generatedFiles.length} files...`)
    execSync(`prettier --write ${generatedFiles.join(' ')}`, {
      // stdio: 'inherit',
    })
    console.log('✅ All files prettified successfully!')
  } catch (error: any) {
    console.warn(
      'Warning: Could not run prettier on generated files:',
      error.message,
    )
  }
}

type Tag = {
  tag: string
  content: {
    kind: string
    text: string
    tag?: string
    target?: number
    tsLinkText?: string
  }[]
}

interface type {
  name: string
  type:
    | 'union'
    | 'reference'
    | 'intrinsic'
    | 'reflection'
    | 'array'
    | 'intersection'
  types: type[]
  declaration?: member
  refersToTypeParameter?: boolean
}

interface member {
  variant: 'param'
  name: string
  parameters: ({
    name: string
    type: type
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
    text?: string
    blockTags: Tag[]
    summary: [
      {
        kind: string
        text: string
      },
    ]
  }
  type?: type
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
