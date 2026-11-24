<script lang="ts" module>
  let seq = 0
</script>

<script lang="ts">
  import type { FieldUIInfo } from '../../../../core/server/remult-admin'
  import { kindOf } from '../fields/field-kind.js'
  import FieldEditor from '../fields/FieldEditor.svelte'
  import Icon from '../shell/Icon.svelte'

  let {
    field,
    value = $bindable(),
    caption,
    editable,
    busy = false,
    dirty = false,
    was,
    reverted = false,
    error,
    onedit,
  }: {
    field: FieldUIInfo
    value: unknown
    caption?: unknown
    editable: boolean
    busy?: boolean
    dirty?: boolean
    /** The saved value as text, shown while the cell is dirty. */
    was?: string
    /** A cancel just put this cell back. */
    reverted?: boolean
    error?: string
    onedit?: () => void
  } = $props()

  const errorId = `cell-error-${++seq}`
  const wasId = `cell-was-${seq}`
  const showWas = $derived(dirty && !error && was !== undefined)
  const kind = $derived(kindOf(field))
  const live = $derived(editable && !field.readOnly)
</script>

<td
  class="cell"
  data-kind={kind}
  data-editable={live ? '' : undefined}
  data-dirty={dirty ? '' : undefined}
  data-reverted={reverted && !dirty ? '' : undefined}
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
    describedby={error ? errorId : showWas ? wasId : undefined}
    {onedit}
  />
  {#if showWas}
    <span class="was" id={wasId}>Was: {was}</span>
  {/if}
  {#if error}
    <span class="error-icon" title={error} aria-hidden="true"
      ><Icon name="alert" size={13} /></span
    >
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
  .cell[data-editable]:is(
      [data-kind='enum'],
      [data-kind='date'],
      [data-kind='color'],
      [data-kind='json']
    ) {
    min-width: 136px;
  }
  .cell[data-editable][data-kind='datetime'] {
    min-width: 200px;
  }
  .cell[data-dirty] {
    background: var(--edited-soft);
  }
  .cell[data-dirty]::before {
    content: '';
    position: absolute;
    inset-block: 0;
    inset-inline-start: 0;
    z-index: 1;
    width: 2px;
    background: var(--edited);
    pointer-events: none;
  }
  .cell[data-reverted] {
    animation: reverted 1400ms var(--ease-out);
  }
  @keyframes reverted {
    0%,
    45% {
      background-color: color-mix(in oklab, var(--text) 9%, transparent);
    }
  }
  /* no motion: paused on its first frame, the tint holds until it is cleared */
  @media (prefers-reduced-motion: reduce) {
    .cell[data-reverted] {
      animation-play-state: paused;
    }
  }
  /* the saved value, like the error message: only while you look at this cell */
  .was {
    visibility: hidden;
    opacity: 0;
    transition:
      opacity 120ms var(--ease-out),
      visibility 0s linear 120ms;
    position: absolute;
    top: calc(100% - 2px);
    inset-inline-start: 4px;
    z-index: 2;
    max-width: 280px;
    padding: 2px 6px;
    overflow: hidden;
    border-radius: var(--radius-sm);
    background: var(--bg-raised);
    box-shadow:
      0 0 0 1px var(--border),
      0 2px 6px oklch(0 0 0 / 0.1);
    color: var(--text-muted);
    font-size: var(--text-xs);
    line-height: 16px;
    text-overflow: ellipsis;
    pointer-events: none;
  }
  .cell:is(:hover, :focus-within) .was {
    visibility: visible;
    opacity: 1;
    transition:
      opacity 120ms var(--ease-out),
      visibility 0s;
  }
  .cell[data-invalid] {
    background: var(--danger-soft);
    box-shadow: inset 0 0 0 1px
      color-mix(in oklch, var(--danger) 60%, transparent);
  }
  .cell[data-invalid] :global(.editor) {
    padding-inline-end: 20px;
  }
  .error-icon {
    position: absolute;
    top: 50%;
    inset-inline-end: 5px;
    display: flex;
    translate: 0 -50%;
    color: var(--danger);
  }
  /* the message is a tooltip: it only covers the next row while you look at this cell */
  .error {
    visibility: hidden;
    opacity: 0;
    transition:
      opacity 120ms var(--ease-out),
      visibility 0s linear 120ms;
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
  .cell:is(:hover, :focus-within) .error {
    visibility: visible;
    opacity: 1;
    transition:
      opacity 120ms var(--ease-out),
      visibility 0s;
  }
</style>
