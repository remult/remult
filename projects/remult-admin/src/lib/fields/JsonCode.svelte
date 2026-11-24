<script lang="ts">
  import { untrack } from 'svelte'
  import { highlightJson, indentAt, parseJson } from './json-text.js'

  let {
    doc,
    label,
    id,
    fit = false,
    invalid = false,
    errorAt,
    describedby,
    onchange,
  }: {
    doc: string
    label?: string
    id?: string
    /** Grows with its content (form), instead of filling a dialog. */
    fit?: boolean
    invalid?: boolean
    /** Offset of the syntax error, marked in the text. */
    errorAt?: number
    describedby?: string
    onchange: (text: string) => void
  } = $props()

  let text = $state(untrack(() => doc))
  let area: HTMLTextAreaElement

  // a trailing newline would collapse in the mirror and leave it one line short of the textarea
  const html = $derived(highlightJson(text, errorAt) + '\n')

  // through the browser's editing command so Ctrl+Z still undoes it
  function insert(s: string) {
    if (!document.execCommand('insertText', false, s)) {
      area.setRangeText(s, area.selectionStart, area.selectionEnd, 'end')
      area.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }

  function format() {
    const p = parseJson(text)
    if (!p.ok || !text.trim()) return
    const pretty = JSON.stringify(p.v, null, 2)
    if (pretty === text) return
    area.focus()
    area.select()
    insert(pretty)
  }

  function onkeydown(e: KeyboardEvent) {
    // Enter or Tab may confirm an IME composition: leave those to the browser
    if (e.isComposing) return
    const mod = e.ctrlKey || e.metaKey || e.altKey
    if (e.key === 'Tab' && !e.shiftKey && !mod) {
      e.preventDefault()
      insert('  ')
    } else if (e.key === 'Enter' && !e.shiftKey && !mod) {
      e.preventDefault()
      insert(indentAt(text, area.selectionStart))
    } else if (e.key === 'F' && e.shiftKey && e.altKey) {
      e.preventDefault()
      format()
    }
  }
</script>

<div class="code" class:fit data-invalid={invalid ? '' : undefined}>
  <div class="scroll">
    <div class="layers">
      <pre aria-hidden="true">{@html html}</pre>
      <textarea
        bind:this={area}
        {id}
        rows="1"
        spellcheck="false"
        autocomplete="off"
        autocapitalize="off"
        aria-label={label}
        aria-invalid={invalid || undefined}
        aria-describedby={describedby}
        value={text}
        oninput={(e) => {
          text = e.currentTarget.value
          onchange(text)
        }}
        {onkeydown}
      ></textarea>
    </div>
  </div>
  <button
    class="format"
    type="button"
    tabindex="-1"
    title="Format (Shift+Alt+F)"
    disabled={errorAt !== undefined || !text.trim()}
    onclick={format}
  >
    Format
  </button>
</div>

<style>
  .code {
    position: relative;
    display: flex;
    flex-direction: column;
    height: min(420px, calc(100dvh - 220px));
    border: 1px solid var(--border-strong);
    border-radius: var(--radius);
    background: var(--bg);
    transition: border-color 120ms var(--ease-out);
  }
  .code.fit {
    height: auto;
    background: var(--bg-raised);
  }
  .code.fit:hover:not(:focus-within) {
    border-color: color-mix(in oklch, var(--border-strong), var(--text) 15%);
  }
  .code:focus-within {
    outline: 2px solid var(--ring);
    outline-offset: -1px;
    border-color: var(--accent);
  }
  .code[data-invalid] {
    border-color: var(--danger);
  }
  .code[data-invalid]:focus-within {
    outline-color: color-mix(in oklch, var(--danger) 60%, transparent);
  }
  .scroll {
    flex: 1;
    min-height: 0;
    overflow: auto;
    border-radius: inherit;
  }
  .fit .scroll {
    min-height: 88px;
    max-height: 320px;
  }
  .layers {
    display: grid;
    min-height: 100%;
  }
  pre,
  textarea {
    grid-area: 1 / 1;
    margin: 0;
    padding: 8px 12px;
    border: 0;
    font-family: var(--mono);
    font-size: var(--text-sm);
    line-height: 1.55;
    tab-size: 2;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    letter-spacing: normal;
  }
  .fit :is(pre, textarea) {
    padding: 6px 8px;
  }
  pre {
    color: var(--text);
    pointer-events: none;
  }
  textarea {
    resize: none;
    overflow: hidden;
    background: transparent;
    color: transparent;
    caret-color: var(--text);
    outline: none;
  }
  textarea::selection {
    background: color-mix(in oklch, var(--accent) 28%, transparent);
  }
  pre :global(i) {
    font-style: normal;
  }
  pre :global(.k) {
    color: var(--accent);
  }
  pre :global(.s) {
    color: var(--success);
  }
  pre :global(.n) {
    color: var(--warning);
  }
  pre :global(.b) {
    color: var(--danger);
  }
  pre :global(.p) {
    color: var(--text-muted);
  }
  pre :global(mark) {
    background: var(--danger-soft);
    color: inherit;
    text-decoration: underline wavy var(--danger);
    text-underline-offset: 3px;
  }
  .format {
    position: absolute;
    top: 4px;
    right: 4px;
    height: 22px;
    padding: 0 8px;
    border: 0;
    border-radius: var(--radius-sm);
    background: var(--bg-raised);
    box-shadow: 0 0 0 1px var(--border);
    color: var(--text-muted);
    font-size: var(--text-xs);
    font-weight: 500;
    cursor: pointer;
    opacity: 0;
    transition-property: opacity, background-color, color;
    transition-duration: 120ms;
    transition-timing-function: var(--ease-out);
  }
  .code:is(:hover, :focus-within) .format:not(:disabled) {
    opacity: 1;
  }
  .format:hover {
    background: var(--bg-hover);
    color: var(--text);
  }
  .format:disabled {
    pointer-events: none;
  }
</style>
