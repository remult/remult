<script lang="ts">
  import Table from '../components/Table.svelte'
  import { godStore } from '../stores/GodStore'

  export let params: { wild?: string } = {}

  $: table = $godStore && $godStore.tables.find((c) => c.key === params.wild)
</script>

<h2>{table?.caption}</h2>

{#if table}
  <Table
    god={$godStore}
    columns={table.fields}
    repo={table.repo}
    relations={table.relations}
  />
{/if}
