<script lang="ts" module>
  let seq = 0
</script>

<script lang="ts">
  import type { FieldUIInfo } from '../../../../core/server/remult-admin'
  import { kindOf } from '../fields/field-kind.js'
  import FieldEditor from '../fields/FieldEditor.svelte'

  let {
    field,
    value = $bindable(),
    caption,
    editable,
    busy = false,
    dirty = false,
    error,
    onedit,
  }: {
    field: FieldUIInfo
    value: unknown
    caption?: unknown
    editable: boolean
    busy?: boolean
    dirty?: boolean
    error?: string
    onedit?: () => void
  } = $props()

  const errorId = `cell-error-${++seq}`
  const kind = $derived(kindOf(field))
  const live = $derived(editable && !field.readOnly)
</script>

<td
  class="cell"
  data-kind={kind}
  data-editable={live ? '' : undefined}
  data-dirty={dirty ? '' : undefined}
  data-invalid={error ? '' : undefined}
>
  <FieldEditor
    {field}
    bind:value
    readonly={!editable}
    variant="cell"
    {caption}
    {busy}
    invalid={!!error}
    describedby={error ? errorId : undefined}
    {onedit}
  />
  {#if error}
    <span class="error" id={errorId}>{error}</span>
  {/if}
</td>

<style>
  .cell {
    position: relative;
    max-width: 320px;
    min-width: 64px;
    height: var(--row-h);
    padding: 0;
    white-space: nowrap;
  }
  .cell[data-editable] {
    padding: 0 1px;
  }
  /* editors have no text to size the column: give each kind a usable width */
  .cell[data-editable] {
    min-width: 160px;
  }
  .cell[data-editable]:is([data-kind='number'], [data-kind='boolean']) {
    min-width: 96px;
  }
  .cell[data-editable]:is([data-kind='enum'], [data-kind='date'], [data-kind='color'], [data-kind='json']) {
    min-width: 136px;
  }
  .cell[data-editable][data-kind='datetime'] {
    min-width: 200px;
  }
  .cell[data-dirty] {
    background: color-mix(in oklch, var(--accent) 9%, transparent);
  }
  .cell[data-invalid] {
    background: var(--danger-soft);
    box-shadow: inset 0 0 0 1px color-mix(in oklch, var(--danger) 60%, transparent);
  }
  .error {
    position: absolute;
    top: calc(100% - 2px);
    inset-inline-start: 4px;
    z-index: 2;
    max-width: 280px;
    padding: 2px 6px;
    overflow: hidden;
    border-radius: var(--radius-sm);
    background: var(--danger);
    color: var(--bg-raised);
    font-size: var(--text-xs);
    font-weight: 500;
    line-height: 16px;
    text-overflow: ellipsis;
    pointer-events: none;
  }
</style>
