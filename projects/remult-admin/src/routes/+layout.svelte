<script lang="ts">
  import '#lib/shell/app.css'
  import { afterNavigate, goto } from '$app/navigation'
  import { onMount } from 'svelte'
  import { god } from '#lib/core/god.svelte.js'
  import { settings } from '#lib/core/settings.svelte.js'
  import Icon from '#lib/shell/Icon.svelte'
  import Nav from '#lib/shell/Nav.svelte'
  import SettingsDialog from '#lib/shell/SettingsDialog.svelte'
  import { shell } from '#lib/shell/shell.svelte.js'
  import Toasts from '#lib/shell/Toasts.svelte'

  let { children } = $props()

  onMount(() => {
    if (shell.tokenRequired) shell.settingsOpen = true
    else god.reload()
  })

  $effect(() => {
    if (god.unauthorized) shell.settingsOpen = true
  })

  $effect(() => {
    const root = document.documentElement
    if (settings.theme === 'system') delete root.dataset.theme
    else root.dataset.theme = settings.theme
  })

  afterNavigate(({ to, type }) => {
    const location = to?.url.hash.slice(1) || '/'
    // only the app opening on Home restores the last location, so Home stays reachable in-app
    if (type === 'enter' && location === '/' && settings.lastLocation !== '/') {
      goto('#' + settings.lastLocation, { replaceState: true })
      return
    }
    if (location !== '/') settings.lastLocation = location
  })

  const collapsed = $derived(settings.navCollapsed || shell.narrow.current)
</script>

<div class="app" data-collapsed={collapsed ? '' : undefined}>
  <Nav />
  <main class="main">
    {#if !god.loaded && !god.loading && shell.tokenRequired}
      <div class="state">
        <span class="state-icon"><Icon name="key" size={20} /></span>
        <h1>Sign in to continue</h1>
        <p>This admin needs an access token to load your entities.</p>
        <button class="btn" data-variant="primary" type="button" onclick={() => (shell.settingsOpen = true)}>
          Enter token
        </button>
      </div>
    {:else if god.error}
      <div class="state" role="alert">
        <span class="state-icon danger"><Icon name="alert" size={20} /></span>
        <h1>{god.unauthorized ? 'Access denied' : 'Could not load entities'}</h1>
        <p>{god.error}</p>
        <div class="state-actions">
          <button class="btn" type="button" onclick={() => (shell.settingsOpen = true)}>
            Open settings
          </button>
          <button class="btn" data-variant="primary" type="button" onclick={() => god.reload()}>
            <Icon name="refresh" size={14} /> Retry
          </button>
        </div>
      </div>
    {:else if god.loaded}
      {@render children()}
    {/if}
  </main>
</div>

<SettingsDialog />
<Toasts />

<style>
  .app {
    display: grid;
    grid-template-columns: var(--nav-w) minmax(0, 1fr);
    height: 100dvh;
    overflow: hidden;
  }
  .app[data-collapsed] {
    grid-template-columns: var(--rail-w) minmax(0, 1fr);
  }
  .main {
    min-width: 0;
    min-height: 0;
    overflow: auto;
  }
  .state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 100%;
    padding: 32px 16px;
    text-align: center;
  }
  .state h1 {
    margin: 8px 0 0;
    font-size: var(--text-xl);
    font-weight: 600;
    letter-spacing: -0.01em;
  }
  .state p {
    margin: 0 0 8px;
    max-width: 44ch;
    color: var(--text-muted);
  }
  .state-icon {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: var(--bg-inset);
    box-shadow: inset 0 0 0 1px var(--border);
    color: var(--text-muted);
  }
  .state-icon.danger {
    color: var(--danger);
    background: var(--danger-soft);
  }
  .state-actions {
    display: flex;
    gap: 8px;
  }
</style>
