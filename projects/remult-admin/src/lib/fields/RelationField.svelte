<script lang="ts">
  import type { FieldUIInfo } from '../../../../core/server/remult-admin'
  import Icon from '../shell/Icon.svelte'

  let {
    value,
    caption,
    label,
    invalid,
    describedby,
    id,
  }: {
    field: FieldUIInfo
    value: unknown
    caption?: unknown
    label: string
    busy: boolean
    invalid: boolean
    describedby?: string
    id?: string
    set: (v: unknown) => void
  } = $props()

  const empty = $derived(value === undefined || value === null || value === '')
  const known = $derived(caption !== undefined && caption !== null && caption !== '')
  const text = $derived(empty ? (value === null ? 'null' : '') : known ? String(caption) : String(value))
</script>

<!-- TODO: the picker (search, pick, unset) plugs in here -->
<button
  {id}
  class="ctl relation"
  type="button"
  aria-label={`${label}: ${text || 'none'}`}
  aria-describedby={describedby}
  title={empty ? undefined : String(value)}
  data-cell-focus
>
  <span class="caption" class:missing={!empty && !known} class:empty>{text}</span>
  <Icon name="chevron-down" size={12} />
</button>

<style>
  .relation {
    display: flex;
    align-items: center;
    gap: 6px;
    text-align: start;
    cursor: pointer;
  }
  .relation :global(svg) {
    color: var(--text-faint);
  }
  .caption {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .missing {
    color: var(--text-faint);
    font-family: var(--mono);
    font-size: var(--text-sm);
  }
  .empty {
    color: var(--text-faint);
    font-family: var(--mono);
    font-size: var(--text-xs);
  }
</style>
