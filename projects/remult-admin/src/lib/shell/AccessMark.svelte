<script lang="ts">
  import type { AdminRule } from '../../../../core/server/remult-admin'
  import { accessHint, accessLabel, type AccessState } from '../core/access.js'
  import Icon, { type IconName } from './Icon.svelte'

  let {
    state,
    hint,
    icon = 'check',
    rule,
  }: {
    state: AccessState
    hint?: string
    icon?: IconName
    rule?: AdminRule
  } = $props()

  const byRoles = $derived(rule === 'roles' && state !== 'row')
  const name = $derived(
    accessLabel(state) +
      (byRoles ? ', by role' : '') +
      (icon === 'filter' && state === 'yes' ? ', prefiltered' : ''),
  )
</script>

<span
  class="mark"
  data-state={state}
  data-icon={icon}
  data-roles={byRoles || undefined}
  role="img"
  aria-label={name}
  title={hint ?? accessHint(state, rule)}
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
  /* a role rule: ring around the mark */
  .mark[data-roles] {
    margin: 0 3.5px;
    box-shadow:
      0 0 0 2px var(--bg),
      0 0 0 3.5px currentColor;
  }
  .fn {
    font: italic 600 15px/1 Georgia, 'Times New Roman', serif;
    translate: -0.5px -0.5px;
  }
</style>
