<script lang="ts">
  import {
    Dialog,
    DialogBackdrop,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogTitle,
  } from '@ui-sdk/svelte/dialog'
  import { untrack } from 'svelte'
  import { god } from '../core/god.svelte.js'
  import {
    arrangeSchema,
    resetSettings,
    session,
    settings,
    type Settings,
  } from '../core/settings.svelte.js'
  import Icon from './Icon.svelte'
  import { shell } from './shell.svelte.js'
  import { toast } from './Toasts.svelte'

  let token = $state('')
  let keyForBearerAuth = $state('')
  let customHeaders = $state('')
  let connecting = $state(false)
  let confirmReset = $state(false)

  // connection fields are drafts: they only apply on Connect, which reloads entities
  function syncDrafts() {
    token = session.bearerAuth
    keyForBearerAuth = settings.keyForBearerAuth
    customHeaders = settings.customHeaders
    confirmReset = false
  }

  // opened by the nav, the palette or a 401: always start from the saved values
  $effect(() => {
    if (shell.settingsOpen) untrack(syncDrafts)
  })

  const tokenRejected = $derived(god.unauthorized && !connecting)

  async function connect(e: SubmitEvent) {
    e.preventDefault()
    session.bearerAuth = token.trim()
    settings.keyForBearerAuth = keyForBearerAuth.trim()
    settings.customHeaders = customHeaders
    connecting = true
    await god.reload()
    connecting = false
    if (god.unauthorized) return
    if (god.error) {
      toast.error(`Could not load entities: ${god.error}`)
      return
    }
    shell.settingsOpen = false
    toast.success(god.userName ? `Connected as ${god.userName}` : 'Connected')
  }

  function reset() {
    if (!confirmReset) {
      confirmReset = true
      return
    }
    const connection = () =>
      settings.keyForBearerAuth + '\n' + settings.customHeaders
    const before = connection()
    resetSettings()
    syncDrafts()
    // entities were loaded with the old token source and headers
    if (connection() !== before) god.reload()
    toast.success('Settings reset to defaults')
  }

  const themes: { value: Settings['theme']; label: string }[] = [
    { value: 'system', label: 'System' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ]

  const liveQuery = [
    { value: 'server', label: 'Server default' },
    { value: 'on', label: 'On' },
    { value: 'off', label: 'Off' },
  ]
  const getLiveQuery = () =>
    settings.disableLiveQuery === undefined
      ? 'server'
      : settings.disableLiveQuery
        ? 'off'
        : 'on'
  const setLiveQuery = (v: string) =>
    (settings.disableLiveQuery = v === 'server' ? undefined : v === 'off')
</script>

<Dialog bind:open={shell.settingsOpen}>
  <DialogBackdrop class="scrim" />
  <DialogContent
    class="settings"
    initialFocus={shell.tokenRequired || god.unauthorized
      ? '#token'
      : undefined}
  >
    <header class="head">
      <div>
        <DialogTitle class="title">Settings</DialogTitle>
        <DialogDescription class="desc"
          >Saved in this browser. The token lasts for this tab only.</DialogDescription
        >
      </div>
      <DialogClose
        class="btn"
        data-variant="ghost"
        data-icon
        aria-label="Close settings"
      >
        <Icon name="x" />
      </DialogClose>
    </header>

    <div class="body">
      <form class="section" onsubmit={connect}>
        <h3>Connection</h3>
        {#if tokenRejected}
          <p class="alert" role="alert">
            <Icon name="alert" size={15} />
            The server rejected this token. Check it and connect again.
          </p>
        {:else if shell.tokenRequired}
          <p class="note">
            This admin needs an access token before it can load your entities.
          </p>
        {/if}
        <label class="field">
          <span class="label">Access token</span>
          <input
            id="token"
            class="input mono"
            type="password"
            autocomplete="off"
            spellcheck="false"
            placeholder="Paste a bearer token"
            bind:value={token}
          />
          <span class="hint"
            >Sent as <code>Authorization: Bearer ...</code></span
          >
        </label>
        <label class="field">
          <span class="label">Or read the token from localStorage key</span>
          <input
            class="input mono"
            type="text"
            spellcheck="false"
            placeholder="e.g. auth_token"
            bind:value={keyForBearerAuth}
          />
        </label>
        <label class="field">
          <span class="label">Custom headers</span>
          <textarea
            class="input"
            rows="2"
            spellcheck="false"
            placeholder="x-tenant: acme"
            bind:value={customHeaders}
          ></textarea>
          <span class="hint">One <code>name: value</code> per line.</span>
        </label>
        <div class="actions">
          <button
            class="btn"
            data-variant="primary"
            type="submit"
            disabled={connecting}
          >
            {connecting ? 'Connecting...' : 'Connect'}
          </button>
        </div>
      </form>

      <section class="section">
        <h3>Display</h3>
        <div class="row">
          <span class="label" id="theme-label">Theme</span>
          <div
            class="segmented"
            role="radiogroup"
            aria-labelledby="theme-label"
          >
            {#each themes as t (t.value)}
              <label
                class="seg"
                data-checked={settings.theme === t.value ? '' : undefined}
              >
                <input
                  type="radio"
                  name="theme"
                  value={t.value}
                  bind:group={settings.theme}
                />
                {t.label}
              </label>
            {/each}
          </div>
        </div>
        <div class="row">
          <span class="label" id="names-label">Show names as</span>
          <div
            class="segmented"
            role="radiogroup"
            aria-labelledby="names-label"
          >
            <label
              class="seg"
              data-checked={settings.displayCaption ? '' : undefined}
            >
              <input
                type="radio"
                name="names"
                value={true}
                bind:group={settings.displayCaption}
              />
              Caption
            </label>
            <label
              class="seg"
              data-checked={!settings.displayCaption ? '' : undefined}
            >
              <input
                type="radio"
                name="names"
                value={false}
                bind:group={settings.displayCaption}
              />
              Key
            </label>
          </div>
        </div>
        <label class="row">
          <span class="label">Rows per page</span>
          <input
            class="input num"
            type="number"
            min="1"
            max="500"
            value={settings.numberOfRows}
            onchange={(e) => {
              const n = Math.round(Number(e.currentTarget.value))
              if (n >= 1 && n <= 500) settings.numberOfRows = n
              else e.currentTarget.value = String(settings.numberOfRows)
            }}
          />
        </label>
        <label class="row">
          <span class="label">Live updates</span>
          <select class="input select" bind:value={getLiveQuery, setLiveQuery}>
            {#each liveQuery as o (o.value)}
              <option value={o.value}>{o.label}</option>
            {/each}
          </select>
        </label>
        <label class="row">
          <span class="label">Schema layout</span>
          <select
            class="input select"
            value={settings.diagramLayout}
            onchange={(e) =>
              arrangeSchema(e.currentTarget.value as Settings['diagramLayout'])}
          >
            <option value="grid-dfs">Grid, depth first</option>
            <option value="grid-bfs">Grid, breadth first</option>
            <option value="line">Line</option>
          </select>
        </label>
        <label class="row">
          <span class="label">Confirm before delete</span>
          <input
            class="switch"
            type="checkbox"
            role="switch"
            bind:checked={settings.confirmDelete}
          />
        </label>
      </section>
    </div>

    <footer class="foot">
      <button class="btn" data-variant="danger" type="button" onclick={reset}>
        {confirmReset ? 'Click again to reset everything' : 'Reset settings'}
      </button>
      <DialogClose class="btn">Done</DialogClose>
    </footer>
  </DialogContent>
</Dialog>

<style>
  :global(.settings) {
    position: fixed;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    display: flex;
    flex-direction: column;
    width: min(520px, calc(100vw - 32px));
    max-height: calc(100dvh - 48px);
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: 12px;
    background: var(--bg-raised);
    color: var(--text);
    box-shadow:
      0 0 0 1px var(--border),
      var(--shadow-pop);
    transition:
      opacity 150ms var(--ease-out),
      scale 150ms var(--ease-out);
  }
  :global(.settings:is([data-starting-style], [data-ending-style])) {
    opacity: 0;
    scale: 0.98;
  }
  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 12px 12px 20px;
  }
  :global(.settings .title) {
    margin: 0;
    font-size: var(--text-lg);
    font-weight: 600;
  }
  :global(.settings .desc) {
    margin: 2px 0 0;
    color: var(--text-muted);
    font-size: var(--text-sm);
  }
  .body {
    overflow-y: auto;
    padding: 0 20px;
  }
  .section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px 0 20px;
    border-top: 1px solid var(--border);
  }
  h3 {
    margin: 0;
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--text-muted);
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    min-height: 28px;
  }
  .label {
    font-weight: 500;
  }
  .hint {
    font-size: var(--text-sm);
    color: var(--text-muted);
  }
  code {
    font-family: var(--mono);
    font-size: 0.92em;
  }
  .mono {
    font-family: var(--mono);
    font-size: var(--text-sm);
  }
  .note,
  .alert {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin: 0;
    padding: 8px 10px;
    border-radius: var(--radius);
    font-size: var(--text-sm);
  }
  .note {
    background: var(--accent-soft);
  }
  .alert {
    background: var(--danger-soft);
    color: var(--danger);
  }
  .alert :global(svg) {
    margin-top: 1px;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
  }
  .num {
    width: 88px;
    text-align: end;
  }
  .select {
    width: 190px;
    padding-inline-end: 4px;
    cursor: pointer;
  }
  .segmented {
    display: inline-flex;
    padding: 2px;
    border-radius: 7px;
    background: var(--bg-inset);
    box-shadow: inset 0 0 0 1px var(--border);
  }
  .seg {
    position: relative;
    display: inline-flex;
    align-items: center;
    height: 24px;
    padding: 0 10px;
    border-radius: 5px;
    color: var(--text-muted);
    font-size: var(--text-sm);
    font-weight: 500;
    cursor: pointer;
    transition:
      background-color 120ms var(--ease-out),
      color 120ms var(--ease-out);
  }
  .seg:hover {
    color: var(--text);
  }
  .seg[data-checked] {
    background: var(--bg-raised);
    color: var(--text);
    box-shadow:
      0 0 0 1px var(--border),
      0 1px 2px oklch(0 0 0 / 0.08);
  }
  .seg input {
    position: absolute;
    inset: 0;
    margin: 0;
    opacity: 0;
    cursor: pointer;
  }
  .seg:has(input:focus-visible) {
    outline: 2px solid var(--ring);
    outline-offset: 1px;
  }
  .switch {
    appearance: none;
    position: relative;
    flex: none;
    width: 30px;
    height: 18px;
    margin: 0;
    border-radius: 9px;
    background: var(--border-strong);
    cursor: pointer;
    transition: background-color 150ms var(--ease-out);
  }
  .switch::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: oklch(1 0 0);
    box-shadow: 0 1px 2px oklch(0 0 0 / 0.2);
    transition: translate 150ms var(--ease-out);
  }
  .switch:checked {
    background: var(--accent);
  }
  .switch:checked::after {
    translate: 12px 0;
  }
  .foot {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    padding: 12px 20px;
    border-top: 1px solid var(--border);
    background: var(--bg-inset);
    border-radius: 0 0 12px 12px;
  }
</style>
