<script lang="ts">
  import { page } from '$app/state'
  import { god } from '#lib/core/god.svelte.js'
  import { settings } from '#lib/core/settings.svelte.js'

  const table = $derived(god.bySuperKey(page.params.key ?? ''))
  const title = $derived(table ? (settings.displayCaption ? table.caption : table.key) : 'Not found')
</script>

<div class="page">
  {#if table}
    <h1 style:--hue={table.color}><span class="hue-dot"></span>{title}</h1>
  {:else}
    <h1>Not found</h1>
    <p>No entity "{page.params.key}" is available to you.</p>
  {/if}
</div>

<style>
  .page {
    padding: 20px 24px;
  }
  h1 {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0;
    font-size: var(--text-xl);
    font-weight: 600;
    letter-spacing: -0.01em;
  }
  p {
    color: var(--text-muted);
  }
</style>
