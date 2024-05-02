<script lang="ts">
  import Table from '../components/Table.svelte'
  import { godStore } from '../stores/GodStore'

  type Props = { params: { wild?: string } }
  let { params = {} }: Props = $props()

  let table: (typeof $godStore.tables)[0] = $state(undefined)

  $effect(() => {
    if ($godStore) {
      table = $godStore.tables.find((c) => c.key === params.wild)
    }
  })
</script>

<!-- <h2>{table?.caption}</h2> -->

{#if table}
  <Table columns={table.fields} repo={table.repo} relations={table.relations} />
{:else}
  Building table...
{/if}
