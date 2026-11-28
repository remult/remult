<script lang="ts">
  import { page } from '$app/state'
  import { god } from '../core/god.svelte.js'
  import { session, settings } from '../core/settings.svelte.js'
  import AccessDialog from './AccessDialog.svelte'
  import Avatar from './Avatar.svelte'
  import Icon from './Icon.svelte'
  import MiddleText from './MiddleText.svelte'
  import Logo from './Logo.svelte'
  import Palette from './Palette.svelte'
  import { entityHref, shell } from './shell.svelte.js'

  const userLabel = $derived(
    god.user ? (god.user.name ?? god.user.id) : 'Anonymous',
  )

  let filterInput: HTMLInputElement | undefined = $state()

  const collapsed = $derived(settings.navCollapsed || shell.narrow.current)
  const label = (t: { caption: string; key: string }) =>
    settings.displayCaption ? t.caption : t.key

  const tables = $derived.by(() => {
    const q = settings.search.trim().toLowerCase()
    if (!q) return god.visibleTables
    return god.visibleTables.filter((t) => label(t).toLowerCase().includes(q))
  })

  const activeKey = $derived(
    page.route.id === '/entity/[key]' ? page.params.key : undefined,
  )
  const onSchema = $derived(page.route.id === '/schema')

  function isTyping(el: EventTarget | null) {
    return (
      el instanceof HTMLElement &&
      (el.isContentEditable ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))
    )
  }

  function onkeydown(e: KeyboardEvent) {
    if (
      e.key !== '/' ||
      e.metaKey ||
      e.ctrlKey ||
      e.altKey ||
      isTyping(e.target)
    )
      return
    if (collapsed || !filterInput) return
    e.preventDefault()
    filterInput.focus()
    filterInput.select()
  }
</script>

<svelte:window {onkeydown} />

<nav class="nav" data-collapsed={collapsed ? '' : undefined} aria-label="Main">
  <div class="brand">
    <a class="logo" href="#/" aria-label="Home">
      <Logo />
      <span class="wide">Admin</span>
    </a>
    <button
      class="btn wide"
      data-variant="ghost"
      data-icon
      type="button"
      aria-label="Collapse navigation"
      title="Collapse navigation"
      onclick={() => (settings.navCollapsed = true)}
    >
      <Icon name="panel" />
    </button>
  </div>

  <div class="tools">
    <Palette compact={collapsed} />
    {#if collapsed && !shell.narrow.current}
      <button
        class="btn rail-btn"
        data-variant="ghost"
        type="button"
        aria-label="Expand navigation"
        title="Expand navigation"
        onclick={() => (settings.navCollapsed = false)}
      >
        <Icon name="panel-open" />
      </button>
    {/if}
  </div>

  <div class="list-head wide">
    <span>Entities</span>
    {#if god.loaded}<span class="count">{tables.length}</span>{/if}
  </div>
  <div class="filter wide">
    <input
      bind:this={filterInput}
      bind:value={settings.search}
      class="input"
      type="search"
      placeholder="Filter"
      aria-label="Filter entities"
      spellcheck="false"
      onkeydown={(e) => {
        if (e.key === 'Escape' && settings.search) {
          e.stopPropagation()
          settings.search = ''
        }
      }}
    />
    {#if !settings.search}<kbd class="slash" aria-hidden="true">/</kbd>{/if}
  </div>

  <ul class="list" aria-label="Entities">
    {#if god.loading && !god.tables.length}
      {#each { length: 7 }, i (i)}
        <li class="skeleton" style:--w="{50 + ((i * 37) % 40)}%"></li>
      {/each}
    {:else}
      {#each tables as t (t.superKey)}
        {@const forbidden = session.forbiddenEntities.includes(t.key)}
        <li>
          <a
            class="item"
            href={entityHref(t.superKey)}
            aria-current={activeKey === t.superKey ? 'page' : undefined}
            title={label(t)}
            style:--hue={t.color}
          >
            <span class="hue-dot"></span>
            <span class="text wide"><MiddleText text={label(t)} /></span>
            {#if forbidden}
              <span class="wide lock" title="Forbidden"
                ><Icon name="lock" size={13} /></span
              >
            {/if}
          </a>
        </li>
      {:else}
        {#if god.loaded && settings.search}
          <li class="empty wide">
            No entity matches "{settings.search}".
            <button
              class="link"
              type="button"
              onclick={() => (settings.search = '')}>Clear</button
            >
          </li>
        {/if}
      {/each}
    {/if}
  </ul>

  <div class="foot">
    <a
      class="item"
      href="#/schema"
      aria-current={onSchema ? 'page' : undefined}
      aria-label="Schema"
      title={collapsed ? 'Schema' : undefined}
    >
      <Icon name="schema" size={15} />
      <span class="text wide">Schema</span>
    </a>
    <button
      class="item"
      type="button"
      aria-label="Settings"
      title={collapsed ? 'Settings' : undefined}
      onclick={() => (shell.settingsOpen = true)}
    >
      <Icon name="settings" size={15} />
      <span class="text wide">Settings</span>
    </button>
    {#if god.loaded}
      <button
        class="item you"
        type="button"
        aria-label="Your access, {userLabel}"
        title={collapsed ? `${userLabel}: your access` : 'Your access'}
        onclick={() => (shell.accessOpen = true)}
      >
        <Avatar name={god.user ? userLabel : undefined} size={22} />
        <span class="text wide">{userLabel}</span>
        <span class="you-hint wide"><Icon name="key" size={13} /></span>
      </button>
    {/if}
  </div>
</nav>

<AccessDialog />

<style>
  .nav {
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: 100%;
    background: var(--bg-nav);
    border-inline-end: 1px solid var(--border);
  }
  .brand {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 48px;
    padding: 0 8px 0 14px;
  }
  .logo {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--text);
    text-decoration: none;
    font-weight: 600;
    font-size: var(--text-lg);
    border-radius: var(--radius);
  }
  .tools {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 0 8px 8px;
  }
  .list-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 14px 6px;
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--text-faint);
  }
  .count {
    font-weight: 500;
  }
  .filter {
    position: relative;
    padding: 0 8px 6px;
  }
  .filter .input {
    height: 26px;
    background: var(--bg);
  }
  .filter .input::-webkit-search-cancel-button {
    cursor: pointer;
  }
  .slash {
    position: absolute;
    right: 14px;
    top: 5px;
    pointer-events: none;
  }
  .list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    margin: 0;
    padding: 2px 8px 8px;
    list-style: none;
  }
  .item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    height: var(--row-h);
    padding: 0 8px;
    border: 0;
    border-radius: var(--radius);
    background: transparent;
    color: var(--text-muted);
    text-decoration: none;
    text-align: start;
    font-size: var(--text-md);
    cursor: pointer;
    transition:
      background-color 100ms var(--ease-out),
      color 100ms var(--ease-out);
  }
  .item:hover {
    background: var(--bg-hover);
    color: var(--text);
  }
  .item[aria-current='page'] {
    /* alpha, not color-mix: mixing with a neutral drags the hue toward its own */
    background: oklch(var(--hue-l) var(--hue-c) var(--hue, 262) / 0.14);
    color: var(--text);
    font-weight: 550;
  }
  .item:not(:has(.hue-dot)) {
    --hue: 262;
  }
  .item[aria-current='page'] .hue-dot {
    box-shadow: 0 0 0 3px oklch(var(--hue-l) var(--hue-c) var(--hue) / 0.3);
  }
  .text {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .lock {
    display: flex;
    color: var(--text-faint);
  }
  .skeleton {
    height: var(--row-h);
    margin: 0 8px;
    display: flex;
    align-items: center;
  }
  .skeleton::before {
    content: '';
    width: var(--w);
    height: 8px;
    border-radius: 4px;
    background: var(--bg-active);
    animation: pulse 1.4s ease-in-out infinite;
  }
  @keyframes pulse {
    50% {
      opacity: 0.5;
    }
  }
  .empty {
    padding: 8px;
    color: var(--text-muted);
    font-size: var(--text-sm);
  }
  .link {
    border: 0;
    padding: 0;
    background: none;
    color: var(--accent);
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .foot {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 8px;
    border-top: 1px solid var(--border);
  }
  .foot .item :global(svg) {
    margin-inline: -1px;
  }
  .you {
    height: 34px;
    margin-top: 4px;
    padding-inline-start: 5px;
    color: var(--text);
    font-weight: 500;
  }
  .you-hint {
    display: flex;
    color: var(--text-faint);
    opacity: 0;
    transition: opacity 100ms var(--ease-out);
  }
  .you:is(:hover, :focus-visible) .you-hint {
    opacity: 1;
  }

  /* rail: icons and hue dots only */
  .nav[data-collapsed] .wide {
    display: none;
  }
  .nav[data-collapsed] .brand {
    justify-content: center;
    padding: 0;
  }
  .nav[data-collapsed] .tools {
    align-items: center;
  }
  .nav[data-collapsed] .list {
    padding-top: 8px;
  }
  .nav[data-collapsed] .item {
    justify-content: center;
    padding: 0;
    height: 32px;
  }
  .rail-btn {
    width: 32px;
    height: 32px;
    padding: 0;
  }
</style>
