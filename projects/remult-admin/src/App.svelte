<script lang="ts">
  import Router from 'svelte-spa-router'
  import Schema from './routes/Schema.svelte'
  import NotFound from './routes/NotFound.svelte'
  import Entity from './routes/Entity.svelte'
  import { godStore } from './stores/GodStore'
  import active from 'svelte-spa-router/active'

  // export let params: { wild?: string } = {}

  const routes = {
    '/': Schema,
    '/entity/*': Entity,
    // This is optional, but if present it must be the last
    '*': NotFound,
  }
</script>

<div class="full">
  <div style="min-width:100px">
    {#each $godStore?.tables ?? [] as t}
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
    <a
      href="#/"
      use:active={{
        path: `/`,
        className: 'active',
      }}>🚀 Diagram</a
    >
  </div>
  <div style="flex-grow: 1;">
    <Router {routes} />
  </div>
</div>

<style>
  .full {
    display: flex;
    gap: 10px;
  }
  /* Style for "active" links; need to mark this :global because the router adds the class directly */
  :global(a.active) {
    color: blue;
    font-weight: bold;
  }
</style>
