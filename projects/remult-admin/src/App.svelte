<script lang="ts">
  import Router, { loc } from 'svelte-spa-router'
  import Schema from './routes/Schema.svelte'
  import NotFound from './routes/NotFound.svelte'
  import Entity from './routes/Entity.svelte'
  import { godStore } from './stores/GodStore'
  import active from 'svelte-spa-router/active'
  import { LSContext } from './lib/stores/LSContext.js'
  import DefaultRoute from './routes/DefaultRoute.svelte'
  import { SSContext } from './lib/stores/SSContext.js'
  import { remult } from '../../core/src/remult-proxy'

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

  export function midTrim(
    str: string,
    o?: { len?: number; midStr?: string },
  ): string {
    const len = o?.len || 30
    if (str.length > len) {
      const midStr = o?.midStr || '...'
      const reducedLen = len - midStr.length
      const trimLength = Math.floor(reducedLen / 2)
      return `${str.slice(0, trimLength).trim()}${midStr}${str
        .slice(-trimLength)
        .trim()}`
    }

    return str
  }

  remult.apiClient.httpClient = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => {
    const f = await fetch(input, {
      ...init,
      headers: $SSContext.settings.bearerAuth
        ? {
            ...init?.headers,
            authorization: 'Bearer ' + $SSContext.settings.bearerAuth,
          }
        : $LSContext.settings.keyForBearerAuth
        ? {
            ...init?.headers,
            authorization:
              'Bearer ' +
              localStorage.getItem($LSContext.settings.keyForBearerAuth),
          }
        : init?.headers,
    })

    if (f.status === 403) {
      const parsedUrl = new URL(f.url)
      const segments = parsedUrl.pathname.split('/')
      const lastSegment = segments.pop() || ''
      $SSContext.forbiddenEntities = [
        ...new Set([...$SSContext.forbiddenEntities, lastSegment]),
      ]
    }

    return f
  }
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
      <header>Remult Settings <i>(Local Storage)</i></header>

      <label style="display: flex; align-items: center; gap: 4px">
        <span>With confirm delete</span>
        <select bind:value={$LSContext.settings.confirmDelete}>
          <option value={false}>No</option>
          <option value={true}>Yes</option>
        </select>
      </label>

      <label style="display: flex; align-items: center; gap: 4px">
        <span>Display fields with</span>
        <select bind:value={$LSContext.settings.dispayCaption}>
          <option value={true}>Caption</option>
          <option value={false}>key</option>
        </select>
      </label>

      <label style="display: flex; align-items: center; gap: 4px">
        <span>Diagram layout algorithm</span>
        <select
          bind:value={$LSContext.settings.diagramLayoutAlgorithm}
          on:change={() => {
            $LSContext.schema = {}
            window.location.reload()
          }}
        >
          <option value={'grid-dfs'}>grid-dfs</option>
          <option value={'grid-bfs'}>grid-bfs</option>
          <option value={'line'}>line</option>
        </select>
      </label>

      <label style="display: flex; align-items: center; gap: 4px">
        <span>Local Storage Key for Auth</span>
        <input
          type="text"
          bind:value={$LSContext.settings.keyForBearerAuth}
          placeholder="Local Storage Key"
        />
      </label>

      <br />

      <button
        on:click={() => {
          LSContext.reset()
        }}>Reset all settings to default</button
      >

      <br />
      <br />
      <hr style="border-top: 1px solid black;" />
      <br />

      <header>Remult Settings <i>(Session Storage)</i></header>

      <label style="display: flex; align-items: center; gap: 4px">
        <span>Auth</span>
        <input
          type="text"
          bind:value={$SSContext.settings.bearerAuth}
          placeholder="bearer"
        />
      </label>
    </dialog>

    <input
      class="tab"
      style="content: 'inner'; margin-left: 4px;"
      type="text"
      placeholder="Search"
      bind:value={$LSContext.settings.search}
    />
    {#each $godStore?.getTables($LSContext) ?? [] as t}
      <a
        class="tab"
        style="--color: {t.color}"
        href="#/entity/{t.key}"
        use:active={{
          path: `/entity/${t.key}`,
          className: 'active',
        }}
      >
        {midTrim($LSContext.settings.dispayCaption ? t.caption : t.key)}
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
    /* nowrap */
    white-space: nowrap;
  }

  input::placeholder {
    color: gray;
    font-style: italic;
  }
</style>
