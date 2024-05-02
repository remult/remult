<script lang="ts">
  import Table from '../components/Table.svelte'
  import { god } from '../global.svelte'

  type Props = { params: { wild?: string } }
  let { params = {} }: Props = $props()

  let table: (typeof god.tables)[0] = $state(undefined)

  $effect(() => {
    table = god.tables.find((c) => c.key === params.wild)
  })
</script>

<!-- <h2>{table?.caption}</h2> -->

{#if table}
  <Table columns={table.fields} repo={table.repo} relations={table.relations} />
{:else}
  Building table...
{/if}
