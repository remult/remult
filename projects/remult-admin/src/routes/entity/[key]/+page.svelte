<script lang="ts">
  import { page } from '$app/state'
  import { god } from '#lib/core/god.svelte.js'
  import Table from '#lib/table/Table.svelte'

  const table = $derived(god.bySuperKey(page.params.key ?? ''))
</script>

{#if table}
  <!-- a new entity (or a reload for a new user) gets a fresh table: no state, query or draft leaks across -->
  {#key table}
    <Table {table} urlBound />
  {/key}
{:else}
  <div class="page">
    <h1>Not found</h1>
    <p>No entity "{page.params.key}" is available to you.</p>
  </div>
{/if}

<style>
  .page {
    padding: 20px 24px;
  }
  h1 {
    margin: 0;
    font-size: var(--text-xl);
    font-weight: 600;
    letter-spacing: -0.01em;
  }
  p {
    color: var(--text-muted);
  }
</style>
