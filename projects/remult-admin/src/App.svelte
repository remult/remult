<script lang="ts">
  import Router from 'svelte-spa-router'
  import Schema from './routes/Schema.svelte'
  import NotFound from './routes/NotFound.svelte'
  import Entity from './routes/Entity.svelte'
  import { onMount } from 'svelte'
  import { God } from './God.svelte'
  import active from 'svelte-spa-router/active'
  import { god } from './global.svelte'

  // export let params: { wild?: string } = {}

  onMount(async () => {
    await god.init()
  })

  const routes = {
    '/': Schema,
    '/entity/*': Entity,
    // This is optional, but if present it must be the last
    '*': NotFound,
  }
</script>

<a
  href="#/"
  use:active={{
    path: `/`,
    className: 'active',
  }}>Schema</a
>
{#each god?.tables ?? [] as t}
  <div>
    <a
      href="#/entity/{t.key}"
      use:active={{
        path: `/entity/${t.key}`,
        className: 'active',
      }}
    >
      {t.caption}
    </a>
  </div>
{/each}

<Router {routes} />

<style>
  /* Style for "active" links; need to mark this :global because the router adds the class directly */
  :global(a.active) {
    color: blue;
    font-weight: bold;
  }
</style>
