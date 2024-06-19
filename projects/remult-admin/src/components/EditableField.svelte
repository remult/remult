<script lang="ts">
  import type {
    EntityRelationToManyInfo,
    EntityUIInfo,
    FieldUIInfo,
  } from '../../../core/server/remult-admin'
  import RelationField from './RelationField.svelte'

  export let value: any
  export let info: FieldUIInfo
</script>

{#if info.relationToOne}
  <RelationField bind:value {info} on:change />
{:else}
  <input bind:value on:change />
{/if}
