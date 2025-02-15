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
  import DialogManagement from './lib/ui/dialog/DialogManagement.svelte'
  import Remult from './lib/icons/remult.svelte'
  import { dialog } from './lib/ui/dialog/dialog.js'
  import DialogSettings from './lib/ui/DialogSettings.svelte'
  import { getHeader } from './lib/helper.js'

  // Save the current location except on '/'
  $: $loc.location !== '/' && ($LSContext.currentLocationHash = $loc.location)

  const routes = {
    '/': DefaultRoute,
    '/diagram': Schema,
    '/entity/*': Entity,
    // This is optional, but if present it must be the last
    '*': NotFound,
  }

  // Add cache implementation
  const cache = new Map<
    string,
    { promise: Promise<Response>; timestamp: number }
  >()
  const CACHE_DURATION = 1000 * 2

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

  // remult.apiClient.url = $LSContext.settings.apiUrl
  remult.apiClient.url = window.optionsFromServer?.rootPath ?? '/api'
  remult.apiClient.httpClient = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => {
    // Only cache GET requests
    if (init?.method && init.method !== 'GET') {
      const f = await fetch(input, {
        ...init,
        headers: getHeader($SSContext, $LSContext, init),
      })
      handleForbidden(f)
      return f
    }

    const cacheKey = input.toString()
    const now = Date.now()

    // Clean up expired cache entries
    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp >= CACHE_DURATION) {
        cache.delete(key)
      }
    }

    // Check cache first
    const cached = cache.get(cacheKey)
    if (cached && now - cached.timestamp < CACHE_DURATION) {
      const response = await cached.promise
      return response.clone()
    }

    // If not in cache, create the promise immediately
    const fetchPromise = fetch(input, {
      ...init,
      headers: getHeader($SSContext, $LSContext, init),
    }).then(async (response) => {
      handleForbidden(response)
      // Store a clone for future use
      const clonedResponse = response.clone()
      return clonedResponse
    })

    // Store in cache immediately
    cache.set(cacheKey, {
      promise: fetchPromise,
      timestamp: now,
    })

    // Return a fresh clone for this request
    const response = await fetchPromise
    return response.clone()

    function handleForbidden(f: Response) {
      if (f.status === 403) {
        const parsedUrl = new URL(f.url)
        const segments = parsedUrl.pathname.split('/')
        const lastSegment = segments.pop() || ''
        $SSContext.forbiddenEntities = [
          ...new Set([...$SSContext.forbiddenEntities, lastSegment]),
        ]
      }
    }
  }
</script>

<div class="app-holder">
  <div class="main-navigation">
    <div class="main-navigation__title">
      Remult Admin
      <button
        on:click={() =>
          dialog.show({
            config: { title: 'Remult Settings' },
            component: DialogSettings,
          })}
        class="icon-button"
      >
        <Remult></Remult>
        <!-- <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          class="bi bi-three-dots-vertical"
          viewBox="0 0 16 16"
          ><path
            d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"
          /></svg
        > -->
      </button>
    </div>

    <input
      class="tab"
      style="content: 'inner'; margin-left: 4px; background-color: white;"
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
    <!-- DIALOG DEMO -->
    <!-- <button
      on:click={async () => {
        const res = await dialog.confirm('Are you sure ?')
        if (res.success) {
          await dialog.confirmDelete('Item to delete')
        }
        console.log(`res`, res)
      }}>confirm</button
    >
    <button
      on:click={async () => {
        const res = await dialog.confirmDelete('Item to delete')
        if (res.success) {
          await dialog.confirm('Are you sure ?')
        }
        console.log(`res`, res)
      }}>confirm delete</button
    >
    <button
      on:click={async () => {
        const res = await dialog.show({ config: {} })
        console.log(`res`, res)
      }}>Show</button
    > -->

    <a
      href="#/diagram"
      class="tab main-navigation__diagram"
      use:active={{
        path: `/diagram`,
        className: 'active',
      }}>🎨 Diagram</a
    >
  </div>

  <div class="main-content">
    <Router {routes} />
  </div>
</div>

<DialogManagement></DialogManagement>

<style>
  a {
    /* margin-left: 1px; */
    border-left: 3px solid hsla(var(--color), 70%, 50%, 1);
    /* background-color: hsla(var(--color), 70%, 50%, 0.05); */
    /* nowrap */
    white-space: nowrap;
  }

  input::placeholder {
    color: #888;
  }
</style>
