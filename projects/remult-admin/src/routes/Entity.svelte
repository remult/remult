<script lang="ts">
  import Table from '../lib/ui/Table.svelte'
  import { godStore } from '../stores/GodStore'

  export let params: { wild?: string } = {}

  $: table =
    $godStore && $godStore.tables.find((c) => c.superKey === params.wild)
</script>

{#if table}
  <Table
    fields={table.fields}
    repo={table.repo}
    relations={table.relations}
    color={table.color}
    defaultOrderBy={table.defaultOrderBy}
  />
{/if}
