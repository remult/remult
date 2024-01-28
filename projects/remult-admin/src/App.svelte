<script lang="ts">
  import Router from 'svelte-spa-router'
  import Schema from './routes/Schema.svelte'
  import NotFound from './routes/NotFound.svelte'
  import Entity from './routes/Entity.svelte'
  import { onMount } from 'svelte'
  import { God } from './God'
  import { godStore } from './stores/GodStore'

  const routes = {
    '/': Schema,
    '/entity/*': Entity,
    // This is optional, but if present it must be the last
    '*': NotFound,
  }
</script>

<a href="#/">Schema</a>
{#each $godStore?.tables ?? [] as t}
  <div>
    <a href="#/entity/{t.key}">
      {t.caption}
    </a>
  </div>
{/each}

<Router {routes} />
