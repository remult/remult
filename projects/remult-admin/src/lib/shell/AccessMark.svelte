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

  // role rules show R or R[] (allowed or not), never the role names
  const roleText = $derived(
    state === 'row'
      ? undefined
      : rule === 'role'
        ? 'R'
        : rule === 'roles'
          ? 'R[]'
          : undefined,
  )
  const name = $derived(
    accessLabel(state) +
      (roleText ? (rule === 'role' ? ', by a role' : ', by roles') : '') +
      (icon === 'filter' && state === 'yes' ? ', prefiltered' : ''),
  )
</script>

<span
  class="mark"
  data-state={state}
  data-icon={icon}
  data-roles={roleText ? '' : undefined}
  role="img"
  aria-label={name}
  title={hint ?? accessHint(state, rule)}
>
  {#if state === 'row'}
    <span class="fn" aria-hidden="true">ƒ</span>
  {:else if roleText}
    <span class="r" aria-hidden="true">{roleText}</span>
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
  .mark[data-roles] {
    width: auto;
    min-width: 22px;
    padding: 0 5px;
    border-radius: 11px;
  }
  .r {
    font: 700 11px/1 var(--mono);
    letter-spacing: -0.02em;
  }
  .mark[data-state='no'] .r {
    text-decoration: line-through;
  }
  .fn {
    font: italic 600 15px/1 Georgia, 'Times New Roman', serif;
    translate: -0.5px -0.5px;
  }
</style>
