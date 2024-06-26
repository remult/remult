<script lang="ts">
  import Table from '../components/Table.svelte'
  import { LSContext } from '../lib/LSContext.js'
  import { godStore } from '../stores/GodStore'

  export let params: { wild?: string } = {}

  $: table = $godStore && $godStore.tables.find((c) => c.key === params.wild)
</script>

{#if table}
  <Table
    fields={table.fields}
    repo={table.repo}
    relations={table.relations}
    color={table.color}
  />
{/if}
