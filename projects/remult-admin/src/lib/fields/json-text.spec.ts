import { describe, expect, it } from 'vitest'
import { highlightJson, indentAt, parseJson } from './json-text.js'

describe('parseJson', () => {
  it('reads valid json, empty text is null', () => {
    expect(parseJson('{"a": [1, true, null, "x"]}')).toEqual({
      ok: true,
      v: { a: [1, true, null, 'x'] },
    })
    expect(parseJson('  ')).toEqual({ ok: true, v: null })
  })

  it('points at the error with line and column', () => {
    expect(parseJson('{\n  "a": 1\n  "b": 2\n}')).toMatchObject({
      ok: false,
      pos: 13,
      line: 3,
      col: 3,
      error: "Expected ',' or '}' (line 3, col 3)",
    })
    expect(parseJson('[1, 2')).toMatchObject({
      ok: false,
      line: 1,
      col: 6,
      error: 'Unexpected end of JSON (line 1, col 6)',
    })
    expect(parseJson('{"a": b}')).toMatchObject({
      ok: false,
      col: 7,
      error: "Unexpected 'b' (line 1, col 7)",
    })
    expect(parseJson('{a: 1}')).toMatchObject({
      ok: false,
      col: 2,
      error: 'Expected a quoted key (line 1, col 2)',
    })
    expect(parseJson('{"a" 1}')).toMatchObject({
      ok: false,
      col: 6,
      error: "Expected ':' (line 1, col 6)",
    })
    expect(parseJson('[1,]')).toMatchObject({
      ok: false,
      col: 4,
      error: "Unexpected ']' (line 1, col 4)",
    })
    expect(parseJson('"abc')).toMatchObject({
      ok: false,
      col: 1,
      error: 'Unterminated string (line 1, col 1)',
    })
    expect(parseJson('"\\x"')).toMatchObject({
      ok: false,
      col: 2,
      error: 'Bad escape (line 1, col 2)',
    })
    expect(parseJson('01')).toMatchObject({
      ok: false,
      col: 2,
      error: 'Unexpected text after the value (line 1, col 2)',
    })
    expect(parseJson('1 2')).toMatchObject({ ok: false, col: 3 })
    expect(parseJson('tru')).toMatchObject({
      ok: false,
      col: 1,
      error: "Unexpected 't' (line 1, col 1)",
    })
  })
})

describe('highlightJson', () => {
  it('wraps tokens and escapes html', () => {
    expect(
      highlightJson('{"k": "<b>", "n": -1.5e3, "t": true, "z": null}'),
    ).toBe(
      '<i class="p">{</i><i class="k">"k"</i><i class="p">:</i> <i class="s">"&lt;b&gt;"</i><i class="p">,</i> ' +
        '<i class="k">"n"</i><i class="p">:</i> <i class="n">-1.5e3</i><i class="p">,</i> ' +
        '<i class="k">"t"</i><i class="p">:</i> <i class="b">true</i><i class="p">,</i> ' +
        '<i class="k">"z"</i><i class="p">:</i> <i class="b">null</i><i class="p">}</i>',
    )
  })

  it('marks the error position', () => {
    expect(highlightJson('[x]', 1)).toBe(
      '<i class="p">[</i><mark>x</mark><i class="p">]</i>',
    )
    // at the end there is no char: mark a space so it shows
    expect(highlightJson('[', 1)).toBe('<i class="p">[</i><mark> </mark>')
  })
})

describe('indentAt', () => {
  it('keeps the line indent, one more level after an opener', () => {
    expect(indentAt('{\n  "a": [', 10)).toBe('\n    ')
    expect(indentAt('{\n  "a": 1,', 10)).toBe('\n  ')
    expect(indentAt('x', 1)).toBe('\n')
  })
})
