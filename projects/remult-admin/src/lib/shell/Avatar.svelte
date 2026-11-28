<script lang="ts">
  import { initials } from '../core/access.js'
  import Icon from './Icon.svelte'

  let { name, size = 22 }: { name: string | undefined; size?: number } =
    $props()
</script>

<span
  class="avatar"
  data-anonymous={name ? undefined : ''}
  style:--size="{size}px"
  aria-hidden="true"
>
  {#if name}{initials(name)}{:else}<Icon
      name="user"
      size={Math.round(size * 0.6)}
    />{/if}
</span>

<style>
  .avatar {
    flex: none;
    display: inline-grid;
    place-items: center;
    width: var(--size);
    height: var(--size);
    border-radius: 50%;
    background: var(--accent-soft);
    box-shadow: inset 0 0 0 1px
      color-mix(in oklch, var(--accent) 22%, transparent);
    color: var(--accent);
    font-size: calc(var(--size) * 0.42);
    font-weight: 600;
    letter-spacing: 0.02em;
    line-height: 1;
    user-select: none;
  }
  .avatar[data-anonymous] {
    background: var(--bg-active);
    box-shadow: inset 0 0 0 1px var(--border);
    color: var(--text-faint);
  }
</style>
