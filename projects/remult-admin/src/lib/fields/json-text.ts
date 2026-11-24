const REGEX_TOKEN = /("(?:[^"\\\n]|\\.)*"?)(?=\s*:)|("(?:[^"\\\n]|\\.)*"?)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b|([{}[\],:])/g
const REGEX_HTML = /[&<>]/g
const REGEX_NUMBER = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y
const REGEX_HEX4 = /[0-9a-fA-F]{4}/y
const REGEX_WS = /[ \t\n\r]*/y
const REGEX_LINE_INDENT = /^[ \t]*/
const REGEX_OPENER = /[[{]\s*$/

const ESCAPES = '"\\/bfnrtu'
const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;' }

export type ParsedJson = { ok: true; v: unknown } | { ok: false; error: string; pos: number; line: number; col: number }

class JsonError extends Error {
  constructor(
    message: string,
    public pos: number,
  ) {
    super(message)
  }
}

/** Offset and reason of the first syntax error: JSON.parse messages differ per browser and often omit the position. */
function scan(text: string) {
  let i = 0
  const ws = () => {
    REGEX_WS.lastIndex = i
    REGEX_WS.test(text)
    i = REGEX_WS.lastIndex
  }
  const unexpected = () =>
    new JsonError(i >= text.length ? 'Unexpected end of JSON' : `Unexpected '${text[i]}'`, i)

  const string = () => {
    const start = i++
    for (;;) {
      const c = text[i]
      if (c === undefined || c === '\n') throw new JsonError('Unterminated string', start)
      if (c === '"') return void i++
      if (c === '\\') {
        const e = text[i + 1]
        if (e === undefined || !ESCAPES.includes(e)) throw new JsonError('Bad escape', i)
        if (e === 'u') {
          REGEX_HEX4.lastIndex = i + 2
          if (!REGEX_HEX4.test(text)) throw new JsonError('Bad escape', i)
          i += 4
        }
        i += 2
      } else if (c.charCodeAt(0) < 0x20) throw new JsonError('Control character in string', i)
      else i++
    }
  }

  const value = (): void => {
    ws()
    const c = text[i]
    if (c === '"') return string()
    if (c === '{') {
      i++
      ws()
      if (text[i] === '}') return void i++
      for (;;) {
        ws()
        if (text[i] !== '"') throw i >= text.length ? unexpected() : new JsonError('Expected a quoted key', i)
        string()
        ws()
        if (text[i] !== ':') throw i >= text.length ? unexpected() : new JsonError("Expected ':'", i)
        i++
        value()
        ws()
        if (text[i] === ',') i++
        else if (text[i] === '}') return void i++
        else throw i >= text.length ? unexpected() : new JsonError("Expected ',' or '}'", i)
      }
    }
    if (c === '[') {
      i++
      ws()
      if (text[i] === ']') return void i++
      for (;;) {
        value()
        ws()
        if (text[i] === ',') i++
        else if (text[i] === ']') return void i++
        else throw i >= text.length ? unexpected() : new JsonError("Expected ',' or ']'", i)
      }
    }
    for (const lit of ['true', 'false', 'null']) {
      if (text.startsWith(lit, i)) return void (i += lit.length)
    }
    REGEX_NUMBER.lastIndex = i
    if (REGEX_NUMBER.test(text)) return void (i = REGEX_NUMBER.lastIndex)
    throw unexpected()
  }

  value()
  ws()
  if (i < text.length) throw new JsonError('Unexpected text after the value', i)
}

function lineCol(text: string, pos: number) {
  const before = text.slice(0, pos)
  const line = before.split('\n').length
  return { line, col: pos - before.lastIndexOf('\n') }
}

/** Empty text is null. Errors carry their position, for the message and the editor mark. */
export function parseJson(text: string): ParsedJson {
  if (!text.trim()) return { ok: true, v: null }
  try {
    return { ok: true, v: JSON.parse(text) }
  } catch (err) {
    let message = err instanceof Error ? err.message : 'Invalid JSON'
    let pos = text.length
    try {
      scan(text)
    } catch (e) {
      if (e instanceof JsonError) {
        message = e.message
        pos = e.pos
      }
    }
    const { line, col } = lineCol(text, pos)
    return { ok: false, error: `${message} (line ${line}, col ${col})`, pos, line, col }
  }
}

const escape = (s: string) => s.replace(REGEX_HTML, (c) => ENTITIES[c])

function tokens(text: string) {
  let out = ''
  let last = 0
  for (const m of text.matchAll(REGEX_TOKEN)) {
    const cls = m[1] ? 'k' : m[2] ? 's' : m[3] ? 'n' : m[4] ? 'b' : 'p'
    out += escape(text.slice(last, m.index)) + `<i class="${cls}">${escape(m[0])}</i>`
    last = m.index + m[0].length
  }
  return out + escape(text.slice(last))
}

/** Escaped html with token classes (k key, s string, n number, b literal, p punctuation), `errorAt` in a mark. */
export function highlightJson(text: string, errorAt?: number) {
  if (errorAt === undefined) return tokens(text)
  const c = text[errorAt]
  const mark = !c || c === '\n' ? ' ' : c
  return (
    tokens(text.slice(0, errorAt)) +
    `<mark>${escape(mark)}</mark>` +
    (c === '\n' ? '\n' : '') +
    tokens(text.slice(errorAt + 1))
  )
}

/** What Enter inserts at `pos`: a newline with the line's indent, one level deeper after `{` or `[`. */
export function indentAt(text: string, pos: number) {
  const lineStart = text.lastIndexOf('\n', pos - 1) + 1
  const line = text.slice(lineStart, pos)
  const indent = REGEX_LINE_INDENT.exec(line)![0]
  return '\n' + indent + (REGEX_OPENER.test(line) ? '  ' : '')
}
