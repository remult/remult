<script lang="ts">
  import Icon from '../shell/Icon.svelte'
  import EditorDialog from './EditorDialog.svelte'
  import { isIsoTimestamp } from './field-kind.js'

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

  let input: HTMLInputElement | undefined = $state()
  let overflowing = $state(false)
  let mounted = $state(false)
  let open = $state(false)
  let text = $state('')

  const str = $derived(
    value === undefined || value === null ? '' : String(value),
  )
  // a timestamp is long but never worth a text dialog
  const long = $derived(
    !isIsoTimestamp(str) && (overflowing || str.includes('\n')),
  )

  $effect(() => {
    const el = input
    if (!el) return
    const measure = () => (overflowing = el.scrollWidth > el.clientWidth + 1)
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  })

  $effect(() => {
    str
    if (input) overflowing = input.scrollWidth > input.clientWidth + 1
  })

  function expand() {
    text = str
    mounted = true
    open = true
  }
</script>

<div class="text">
  <input
    bind:this={input}
    {id}
    class="ctl"
    type="text"
    spellcheck="false"
    autocomplete="off"
    aria-label={id ? undefined : label}
    aria-invalid={invalid || undefined}
    aria-describedby={describedby}
    placeholder={value === null ? 'null' : ''}
    readonly={busy}
    data-cell-focus
    bind:value={() => str, (v) => set(v)}
  />
  {#if long}
    <button
      class="expand"
      type="button"
      aria-label={`Edit ${label} in a larger box`}
      title="Edit in a larger box"
      onclick={expand}
    >
      <Icon name="expand" size={12} />
    </button>
  {/if}
</div>

{#if mounted}
  <EditorDialog
    bind:open
    title={label}
    initialFocus="textarea"
    onapply={() => text !== str && set(text)}
  >
    <textarea
      class="input long"
      rows="12"
      spellcheck="false"
      aria-label={label}
      bind:value={text}
    ></textarea>
  </EditorDialog>
{/if}

<style>
  .text {
    display: flex;
    gap: 2px;
    align-items: center;
    min-width: 0;
    flex: 1;
  }
  .expand {
    position: relative;
    display: grid;
    flex: none;
    place-items: center;
    width: 20px;
    height: 20px;
    border: 0;
    border-radius: var(--radius-sm);
    background: var(--bg-raised);
    box-shadow: 0 0 0 1px var(--border);
    color: var(--text-muted);
    cursor: pointer;
    transition-property: opacity, color, background-color;
    transition-duration: 120ms;
    transition-timing-function: var(--ease-out);
  }
  .expand::before {
    content: '';
    position: absolute;
    inset: -4px;
  }
  .expand {
    opacity: 0;
  }
  .text:is(:hover, :focus-within) .expand {
    opacity: 1;
  }
  @media (hover: none) {
    .expand {
      opacity: 1;
    }
  }
  .expand:hover {
    color: var(--text);
    background: var(--bg-hover);
  }
  .long {
    min-height: 240px;
    font-family: var(--font);
    font-size: var(--text-md);
    line-height: 1.5;
  }
</style>
