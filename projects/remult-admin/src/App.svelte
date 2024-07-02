<script lang="ts">
  import Router, { loc } from 'svelte-spa-router'
  import Schema from './routes/Schema.svelte'
  import NotFound from './routes/NotFound.svelte'
  import Entity from './routes/Entity.svelte'
  import { godStore } from './stores/GodStore'
  import active from 'svelte-spa-router/active'
  import { LSContext } from './lib/stores/LSContext.js'
  import DefaultRoute from './routes/DefaultRoute.svelte'

  // Save the current location except on '/'
  $: $loc.location !== '/' && ($LSContext.currentLocationHash = $loc.location)

  const routes = {
    '/': DefaultRoute,
    '/diagram': Schema,
    '/entity/*': Entity,
    // This is optional, but if present it must be the last
    '*': NotFound,
  }

  let settingsDialog
</script>

<div class="app-holder">
  <div class="main-navigation">
    <div class="main-navigation__title">
      Remult Admin
      <button on:click={() => settingsDialog.showModal()} class="icon-button"
        ><svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          class="bi bi-three-dots-vertical"
          viewBox="0 0 16 16"
          ><path
            d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"
          /></svg
        >
      </button>
    </div>

    <dialog bind:this={settingsDialog}>
      <header>Remult Settings</header>
      <button
        on:click={() => {
          LSContext.reset()
        }}>Reset to default</button
      >
    </dialog>

    {#each $godStore?.tables ?? [] as t}
      <a
        class="tab"
        style="--color: {t.color}"
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
      href="#/diagram"
      class="tab main-navigation__diagram"
      use:active={{
        path: `/diagram`,
        className: 'active',
      }}>Diagram</a
    >
  </div>

  <div class="main-content">
    <Router {routes} />
  </div>
</div>

<style>
  a {
    /* margin-left: 1px; */
    border-left: 3px solid hsla(var(--color), 70%, 50%, 1);
    /* background-color: hsla(var(--color), 70%, 50%, 0.05); */
  }
</style>
