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

<div class="app-holder">

  <div class="main-navigation">
    <div class="main-navigation__title">Remult Admin</div>
    {#each $godStore?.tables ?? [] as t}
        <a
          class="tab"
          href="#/entity/{t.key}"
          use:active={{
            path: `/entity/${t.key}`,
            className: 'active',
          }}
        >
          {t.caption}
        </a>
    {/each}
    <a
      href="#/"
      class="tab"
      use:active={{
        path: `/`,
        className: 'active',
      }}>Diagram</a
    >
  </div>

  <div class="main-content">
    <Router {routes} />
  </div>
</div>

<style>
</style>
