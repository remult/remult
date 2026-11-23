<script lang="ts">
  import { onMount } from 'svelte'
  import { god } from '#lib/core/god.svelte.js'

  let { children } = $props()

  onMount(() => {
    god.reload()
  })
</script>

{#if god.error}
  <p role="alert">Failed to load entities: {god.error}</p>
{:else if !god.loaded}
  <p>Loading...</p>
{:else}
  {@render children()}
{/if}
