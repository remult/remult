<script lang="ts">
  import { accessHint, accessLabel, type AccessState } from '../core/access.js'
  import Icon, { type IconName } from './Icon.svelte'

  let {
    state,
    hint,
    icon = 'check',
  }: { state: AccessState; hint?: string; icon?: IconName } = $props()
</script>

<span
  class="mark"
  data-state={state}
  data-icon={icon}
  role="img"
  aria-label={accessLabel(state)}
  title={hint ?? accessHint(state)}
>
  {#if state === 'row'}
    <span class="fn" aria-hidden="true">ƒ</span>
  {:else}
    <Icon name={state === 'yes' ? icon : 'minus'} size={13} stroke={2.4} />
  {/if}
</span>

<style>
  .mark {
    display: inline-grid;
    place-items: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    color: var(--text-faint);
    vertical-align: middle;
    cursor: help;
  }
  .mark[data-state='yes'] {
    background: var(--success-soft);
    color: var(--success);
  }
  .mark[data-state='yes'][data-icon='filter'] {
    background: var(--accent-soft);
    color: var(--accent);
  }
  .mark[data-state='row'] {
    background: color-mix(in oklch, var(--warning) 14%, transparent);
    color: var(--warning);
  }
  .fn {
    font: italic 600 15px/1 Georgia, 'Times New Roman', serif;
    translate: -0.5px -0.5px;
  }
</style>
