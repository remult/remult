<script lang="ts">
  import {
    Dialog,
    DialogBackdrop,
    DialogClose,
    DialogContent,
    DialogTitle,
  } from '@ui-sdk/svelte/dialog'
  import type { Snippet } from 'svelte'
  import Icon from '../shell/Icon.svelte'
  import { modKey } from '../shell/shell.svelte.js'

  let {
    open = $bindable(false),
    title,
    error,
    wide = false,
    canApply = true,
    initialFocus,
    onapply,
    children,
  }: {
    open?: boolean
    title: string
    /** Shown in the footer; blocks Apply. */
    error?: string
    wide?: boolean
    canApply?: boolean
    /** Selector of the editor to focus on open. */
    initialFocus?: string
    onapply: () => void
    children: Snippet
  } = $props()

  function apply() {
    if (!canApply || error) return
    onapply()
    open = false
  }

  function onkeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      // the row under the dialog would save on the same keys
      e.preventDefault()
      apply()
    }
  }
</script>

<Dialog bind:open>
  <DialogBackdrop class="scrim" />
  <DialogContent
    class="editor-dialog"
    data-wide={wide ? '' : undefined}
    {initialFocus}
    {onkeydown}
  >
    <header class="head">
      <DialogTitle class="title">{title}</DialogTitle>
      <DialogClose
        class="btn"
        data-variant="ghost"
        data-icon
        aria-label="Close"
      >
        <Icon name="x" />
      </DialogClose>
    </header>
    <div class="body">
      {@render children()}
    </div>
    <footer class="foot">
      <span class="error" role={error ? 'alert' : undefined}>
        {#if error}<Icon name="alert" size={14} />{error}{/if}
      </span>
      <span class="hint"><kbd>{modKey}</kbd> <kbd>Enter</kbd></span>
      <DialogClose class="btn">Cancel</DialogClose>
      <button
        class="btn"
        data-variant="primary"
        type="button"
        disabled={!canApply || !!error}
        onclick={apply}
      >
        Apply
      </button>
    </footer>
  </DialogContent>
</Dialog>

<style>
  :global(.editor-dialog) {
    position: fixed;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    display: flex;
    flex-direction: column;
    width: min(560px, calc(100vw - 32px));
    max-height: calc(100dvh - 48px);
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: 12px;
    background: var(--bg-raised);
    color: var(--text);
    box-shadow:
      0 0 0 1px var(--border),
      var(--shadow-pop);
    /* it renders inside a table cell: don't inherit the cell's text layout */
    white-space: normal;
    text-align: start;
    font-family: var(--font);
    font-size: var(--text-md);
    cursor: auto;
    transition:
      opacity 150ms var(--ease-out),
      scale 150ms var(--ease-out);
  }
  :global(.editor-dialog[data-wide]) {
    width: min(880px, calc(100vw - 32px));
  }
  :global(.editor-dialog:is([data-starting-style], [data-ending-style])) {
    opacity: 0;
    scale: 0.98;
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 12px 8px 20px;
  }
  :global(.editor-dialog .title) {
    margin: 0;
    font-size: var(--text-lg);
    font-weight: 600;
  }
  .body {
    display: flex;
    flex-direction: column;
    min-height: 0;
    padding: 0 20px 16px;
  }
  .foot {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    border-top: 1px solid var(--border);
    background: var(--bg-inset);
    border-radius: 0 0 12px 12px;
  }
  .error {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    min-width: 0;
    color: var(--danger);
    font-size: var(--text-sm);
  }
  .hint {
    color: var(--text-faint);
    font-size: var(--text-xs);
  }
  @media (hover: none) {
    .hint {
      display: none;
    }
  }
</style>
