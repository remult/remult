<script lang="ts">
  import { json } from '@codemirror/lang-json'
  import { EditorView, minimalSetup } from 'codemirror'
  import { untrack } from 'svelte'

  let { doc, onchange }: { doc: string; onchange: (text: string) => void } = $props()

  let host: HTMLDivElement

  $effect(() => {
    // static imports: the admin ships as one file anyway, and they tree-shake (basicSetup stays out)
    const view = new EditorView({
      doc: untrack(() => doc),
      parent: host,
      extensions: [
        minimalSetup,
        json(),
        EditorView.lineWrapping,
        EditorView.updateListener.of((u) => {
          if (u.docChanged) onchange(u.state.doc.toString())
        }),
      ],
    })
    return () => view.destroy()
  })
</script>

<div class="code" bind:this={host}></div>

<style>
  .code {
    height: min(420px, calc(100dvh - 220px));
    overflow: hidden;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius);
    background: var(--bg);
  }
  .code:focus-within {
    outline: 2px solid var(--ring);
    outline-offset: -1px;
    border-color: var(--accent);
  }
  .code :global(.cm-editor) {
    height: 100%;
    font-size: var(--text-sm);
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
  .code :global(.cm-line) {
    padding: 0 12px;
  }
  .code :global(.cm-selectionBackground),
  .code :global(.cm-focused .cm-selectionBackground) {
    background: var(--accent-soft) !important;
  }
  .code :global(.cm-cursor) {
    border-left-color: var(--text);
  }
</style>
