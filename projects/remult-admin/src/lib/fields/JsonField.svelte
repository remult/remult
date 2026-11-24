<script lang="ts">
  import Icon from '../shell/Icon.svelte'
  import EditorDialog from './EditorDialog.svelte'
  import JsonCode from './JsonCode.svelte'

  let {
    value,
    label,
    busy,
    invalid,
    describedby,
    id,
    set,
  }: {
    value: unknown
    label: string
    busy: boolean
    invalid: boolean
    describedby?: string
    id?: string
    set: (v: unknown) => void
  } = $props()

  let mounted = $state(false)
  let open = $state(false)
  let text = $state('')
  // a fresh editor per opening, seeded with the current value
  let opens = $state(0)

  const preview = $derived(value === undefined ? '' : JSON.stringify(value))

  const parsed = $derived.by((): { ok: true; v: unknown } | { ok: false; error: string } => {
    if (!text.trim()) return { ok: true, v: null }
    try {
      return { ok: true, v: JSON.parse(text) }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Invalid JSON' }
    }
  })

  function edit() {
    if (busy) return
    text = value === undefined || value === null ? '' : JSON.stringify(value, null, 2)
    opens++
    mounted = true
    open = true
  }

  function apply() {
    if (!parsed.ok) return
    if (JSON.stringify(parsed.v) !== JSON.stringify(value ?? null)) set(parsed.v)
  }
</script>

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
  <span class="preview" class:null={value === null}>{value === null ? 'null' : preview}</span>
  <Icon name="braces" size={12} />
</button>

{#if mounted}
  <EditorDialog bind:open title={label} wide initialFocus=".cm-content" error={parsed.ok ? undefined : parsed.error} onapply={apply}>
    {#key opens}
      <JsonCode doc={text} onchange={(t) => (text = t)} />
    {/key}
  </EditorDialog>
{/if}

<style>
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
