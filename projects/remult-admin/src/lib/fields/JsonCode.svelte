<script lang="ts">
  import { json } from '@codemirror/lang-json'
  import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
  import { tags as t } from '@lezer/highlight'
  import { EditorView, minimalSetup } from 'codemirror'
  import { untrack } from 'svelte'

  let {
    doc,
    label,
    fit = false,
    invalid = false,
    describedby,
    onchange,
  }: {
    doc: string
    label?: string
    /** Grows with its content (form), instead of filling a dialog. */
    fit?: boolean
    invalid?: boolean
    describedby?: string
    onchange: (text: string) => void
  } = $props()

  let host: HTMLDivElement
  let view: EditorView | undefined = $state()

  // theme tokens, so light and dark both read (the default style is tuned for white only)
  const highlight = HighlightStyle.define([
    { tag: t.propertyName, color: 'var(--accent)' },
    { tag: t.string, color: 'var(--success)' },
    { tag: t.number, color: 'var(--warning)' },
    { tag: [t.bool, t.null], color: 'var(--danger)' },
    { tag: [t.brace, t.squareBracket, t.separator, t.punctuation], color: 'var(--text-muted)' },
  ])

  $effect(() => {
    const name = untrack(() => label)
    // static imports: the admin ships as one file anyway, and they tree-shake (basicSetup stays out)
    const v = new EditorView({
      doc: untrack(() => doc),
      parent: host,
      extensions: [
        minimalSetup,
        syntaxHighlighting(highlight),
        json(),
        EditorView.lineWrapping,
        EditorView.contentAttributes.of(name ? { 'aria-label': name } : {}),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) onchange(u.state.doc.toString())
        }),
      ],
    })
    view = v
    return () => v.destroy()
  })

  // set on the live editor: rebuilding it on every keystroke that flips validity would drop focus
  $effect(() => {
    const el = view?.contentDOM
    if (!el) return
    if (invalid) el.setAttribute('aria-invalid', 'true')
    else el.removeAttribute('aria-invalid')
    if (describedby) el.setAttribute('aria-describedby', describedby)
    else el.removeAttribute('aria-describedby')
  })
</script>

<div class="code" class:fit data-invalid={invalid ? '' : undefined} bind:this={host}></div>

<style>
  .code {
    height: min(420px, calc(100dvh - 220px));
    overflow: hidden;
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
  .code :global(.cm-editor) {
    height: 100%;
    font-size: var(--text-sm);
  }
  .fit :global(.cm-editor) {
    min-height: 88px;
    max-height: 320px;
  }
  .code :global(.cm-editor.cm-focused) {
    outline: none;
  }
  .code :global(.cm-scroller) {
    font-family: var(--mono);
    line-height: 1.55;
  }
  .code :global(.cm-content) {
    padding: 8px 0;
    caret-color: var(--text);
  }
  .fit :global(.cm-content) {
    padding: 6px 0;
  }
  .code :global(.cm-line) {
    padding: 0 12px;
  }
  .fit :global(.cm-line) {
    padding: 0 8px;
  }
  .code :global(.cm-selectionBackground),
  .code :global(.cm-focused .cm-selectionBackground) {
    background: var(--accent-soft) !important;
  }
  .code :global(.cm-cursor) {
    border-left-color: var(--text);
  }
</style>
