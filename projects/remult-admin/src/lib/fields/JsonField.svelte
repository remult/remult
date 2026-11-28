<script lang="ts">
  import { untrack } from 'svelte'
  import Icon from '../shell/Icon.svelte'
  import EditorDialog from './EditorDialog.svelte'
  import JsonCode from './JsonCode.svelte'
  import { parseJson } from './json-text.js'

  let {
    value,
    label,
    busy,
    invalid,
    describedby,
    id,
    inline = false,
    set,
    onerror,
  }: {
    value: unknown
    label: string
    busy: boolean
    invalid: boolean
    describedby?: string
    id?: string
    /** Edit in place (form) instead of a dialog. */
    inline?: boolean
    set: (v: unknown) => void
    /** Inline: the parse error of the text, undefined once it parses. */
    onerror?: (message: string | undefined) => void
  } = $props()

  const format = (v: unknown) =>
    v === undefined || v === null ? '' : JSON.stringify(v, null, 2)
  const stamp = (v: unknown) => JSON.stringify(v ?? null)

  let mounted = $state(false)
  let open = $state(false)
  let text = $state(untrack(() => (inline ? format(value) : '')))
  // a fresh editor per opening (or outside change), seeded with the current value
  let opens = $state(0)
  // the value this editor last showed or wrote: anything else came from outside (reset, save)
  let known = untrack(() => stamp(value))

  const preview = $derived(value === undefined ? '' : JSON.stringify(value))

  const parsed = $derived(parseJson(text))
  const errorAt = $derived(parsed.ok ? undefined : parsed.pos)

  $effect(() => {
    if (!inline) return
    const s = stamp(value)
    if (s === known) return
    known = s
    untrack(() => {
      text = format(value)
      opens++
    })
  })

  $effect(() => {
    if (inline) onerror?.(parsed.ok ? undefined : parsed.error)
  })

  function edit() {
    if (busy) return
    text = format(value)
    opens++
    mounted = true
    open = true
  }

  function apply() {
    if (!parsed.ok) return
    if (JSON.stringify(parsed.v) !== JSON.stringify(value ?? null))
      set(parsed.v)
  }

  function typed(t: string) {
    text = t
    if (!parsed.ok || busy) return
    const s = stamp(parsed.v)
    if (s === stamp(value)) return
    known = s
    set(parsed.v)
  }
</script>

{#if inline}
  <div class="inline">
    {#if value === null && !text}<span class="null-hint" aria-hidden="true"
        >null</span
      >{/if}
    {#key opens}
      <JsonCode
        doc={text}
        {label}
        {id}
        fit
        invalid={invalid || !parsed.ok}
        {errorAt}
        {describedby}
        onchange={typed}
      />
    {/key}
  </div>
{:else}
  <button
    {id}
    class="ctl json"
    type="button"
    aria-label={`Edit ${label} (JSON)`}
    aria-describedby={describedby}
    aria-haspopup="dialog"
    data-cell-focus
    onclick={edit}
  >
    <span class="preview" class:null={value === null}
      >{value === null ? 'null' : preview}</span
    >
    <Icon name="braces" size={12} />
  </button>
{/if}

{#if mounted}
  <EditorDialog
    bind:open
    title={label}
    wide
    initialFocus="textarea"
    error={parsed.ok ? undefined : parsed.error}
    onapply={apply}
  >
    {#key opens}
      <JsonCode
        doc={text}
        {label}
        invalid={!parsed.ok}
        {errorAt}
        onchange={(t) => (text = t)}
      />
    {/key}
  </EditorDialog>
{/if}

<style>
  .inline {
    position: relative;
    min-width: 0;
  }
  .null-hint {
    position: absolute;
    top: 8px;
    left: 9px;
    z-index: 1;
    color: var(--text-faint);
    font-family: var(--mono);
    font-size: var(--text-xs);
    pointer-events: none;
  }
  .json {
    display: flex;
    align-items: center;
    gap: 6px;
    text-align: start;
    cursor: pointer;
  }
  .json :global(svg) {
    color: var(--text-faint);
  }
  .preview {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: var(--mono);
    font-size: var(--text-sm);
    color: var(--text-muted);
  }
  .null {
    color: var(--text-faint);
    font-size: var(--text-xs);
  }
</style>
