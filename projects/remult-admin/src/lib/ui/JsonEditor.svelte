<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view'
  import { EditorState } from '@codemirror/state'
  import { json, jsonParseLinter } from '@codemirror/lang-json'
  import {
    syntaxHighlighting,
    defaultHighlightStyle,
    bracketMatching,
    indentOnInput,
  } from '@codemirror/language'
  import { history, historyKeymap, defaultKeymap } from '@codemirror/commands'
  import { linter, lintGutter } from '@codemirror/lint'
  import type { Content } from './json-editor'

  export let content: Content
  export let onChange: ((content: Content) => void) | undefined = undefined

  let container: HTMLDivElement
  let view: EditorView | undefined

  const initialDoc =
    content?.json !== undefined ? JSON.stringify(content.json, null, 2) : ''

  onMount(() => {
    const state = EditorState.create({
      doc: initialDoc,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        indentOnInput(),
        bracketMatching(),
        history(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        json(),
        linter(jsonParseLinter()),
        lintGutter(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        EditorView.updateListener.of((v) => {
          if (!v.docChanged || !onChange) return
          const text = v.state.doc.toString()
          try {
            onChange({ json: JSON.parse(text) })
          } catch {
            // invalid JSON while the user is typing; lintGutter already
            // surfaces the error - don't overwrite value with garbage
          }
        }),
        EditorView.theme({
          '&': { height: '100%' },
          '.cm-scroller': { overflow: 'auto' },
        }),
      ],
    })
    view = new EditorView({ state, parent: container })
  })

  onDestroy(() => {
    view?.destroy()
  })
</script>

<div class="json-editor" bind:this={container}></div>

<style>
  .json-editor {
    width: 100%;
    height: 100%;
    min-height: 300px;
    border: 1px solid var(--border-color);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 13px;
    overflow: hidden;
  }

  .json-editor :global(.cm-editor) {
    height: 100%;
  }

  .json-editor :global(.cm-editor.cm-focused) {
    outline: none;
  }
</style>
