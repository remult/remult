<script lang="ts">
  import Boolean from './Boolean.svelte'
  import Date from './Date.svelte'
  import Json from './Json.svelte'
  import List from './List.svelte'
  import Number from './Number.svelte'
  import String from './String.svelte'

  export let type: 'json' | 'number' | 'boolean' | 'date' | 'string' = 'string'
  export let isSelect = false
</script>

{#if type === 'boolean'}
  <Boolean></Boolean>
{:else if isSelect}
  <List></List>
{:else if type === 'json'}
  <Json></Json>
{:else if type === 'number'}
  <Number />
{:else if type === 'date'}
  <Date></Date>
{:else}
  <String></String>
{/if}
