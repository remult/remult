<script lang="ts">
  import { accessLabel, type AccessState } from '../core/access.js'

  let { state, hint }: { state: AccessState; hint?: string } = $props()
</script>

<span
  class="mark"
  data-state={state}
  title={hint ??
    (state === 'row' ? 'The server decides for each row' : undefined)}
  >{accessLabel(state)}</span
>

<style>
  .mark {
    font-size: var(--text-sm);
    color: var(--text-muted);
    white-space: nowrap;
  }
  .mark[data-state='no'] {
    color: var(--text-faint);
  }
  .mark[data-state='row'] {
    color: var(--warning);
  }
</style>
