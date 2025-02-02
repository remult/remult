<script lang="ts">
  import Table from '../lib/ui/Table.svelte'
  import { godStore } from '../stores/GodStore'

  interface Props {
    params?: { wild?: string };
  }

  let { params = {} }: Props = $props();

  let table = $derived($godStore && $godStore.tables.find((c) => c.key === params.wild))
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
