<script lang="ts">
  import { accessState, PREFILTER_HINT } from '#lib/core/access.js'
  import { god, type TableInfo } from '#lib/core/god.svelte.js'
  import { session, settings } from '#lib/core/settings.svelte.js'
  import AccessMark from '#lib/shell/AccessMark.svelte'
  import Icon from '#lib/shell/Icon.svelte'
  import { entityHref, modKey, shell } from '#lib/shell/shell.svelte.js'

  const label = (t: TableInfo) => (settings.displayCaption ? t.caption : t.key)
</script>

<div class="page">
  <header class="head">
    <h1>Entities</h1>
    <p>
      {god.visibleTables.length} available to you. Press <kbd>{modKey}</kbd>
      <kbd>K</kbd> to jump to one.
    </p>
  </header>

  {#if god.visibleTables.length === 0}
    <div class="empty">
      <p>No entity is shown to this user.</p>
      <button
        class="btn"
        type="button"
        onclick={() => (shell.settingsOpen = true)}
      >
        <Icon name="settings" size={14} /> Change token
      </button>
    </div>
  {:else}
    <table class="grid">
      <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col" class="hide-sm">Key</th>
          <th scope="col" class="num">Fields</th>
          <th scope="col" class="num hide-sm">Relations</th>
          <th scope="col">Create</th>
          <th scope="col">Edit</th>
          <th scope="col">Delete</th>
          <th scope="col" title={PREFILTER_HINT}>Prefilter</th>
        </tr>
      </thead>
      <tbody>
        {#each god.visibleTables as t (t.superKey)}
          {@const forbidden = session.forbiddenEntities.includes(t.key)}
          <tr style:--hue={t.color}>
            <th scope="row">
              <a href={entityHref(t.superKey)}>
                <span class="hue-dot"></span>
                {label(t)}
              </a>
              {#if forbidden}
                <span
                  class="badge"
                  title="The server refused to read this entity"
                >
                  <Icon name="lock" size={12} /> Forbidden
                </span>
              {/if}
              {#if t.editModeLocked}
                <span class="badge"
                  >{t.editMode === 'drawer'
                    ? 'Drawer only'
                    : 'Inline only'}</span
                >
              {/if}
            </th>
            <td class="mono hide-sm">{t.key}</td>
            <td class="num">{t.fields.length}</td>
            <td class="num hide-sm">{t.relations.length}</td>
            <td><AccessMark state={accessState(t.permissions.insert)} /></td>
            <td><AccessMark state={accessState(t.permissions.update)} /></td>
            <td><AccessMark state={accessState(t.permissions.delete)} /></td>
            <td
              ><AccessMark
                state={t.apiPrefilter ? 'yes' : 'no'}
                hint={t.apiPrefilter ? PREFILTER_HINT : undefined}
              /></td
            >
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  .page {
    max-width: 960px;
    padding: 28px 32px 48px;
  }
  .head h1 {
    margin: 0;
    font-size: var(--text-xl);
    font-weight: 600;
    letter-spacing: -0.01em;
  }
  .head p {
    margin: 4px 0 20px;
    color: var(--text-muted);
  }
  .grid {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    background: var(--bg-raised);
    overflow: hidden;
  }
  thead th {
    height: 30px;
    padding: 0 12px;
    background: var(--bg-inset);
    border-bottom: 1px solid var(--border);
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--text-muted);
    text-align: start;
    white-space: nowrap;
  }
  tbody th,
  td {
    height: 34px;
    padding: 0 12px;
    border-bottom: 1px solid var(--border);
    text-align: start;
    font-weight: 400;
    white-space: nowrap;
  }
  tbody tr:last-child > * {
    border-bottom: 0;
  }
  tbody tr {
    transition: background-color 100ms var(--ease-out);
  }
  tbody tr:hover {
    background: var(--bg-hover);
  }
  tbody th a {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: var(--text);
    font-weight: 500;
    text-decoration: none;
  }
  tbody th a:hover {
    text-decoration: underline;
    text-underline-offset: 3px;
    text-decoration-color: var(--border-strong);
  }
  .num {
    text-align: end;
  }
  .mono {
    font-family: var(--mono);
    font-size: var(--text-sm);
    color: var(--text-muted);
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    margin-inline-start: 8px;
    padding: 0 6px;
    border-radius: 9px;
    background: var(--bg-inset);
    box-shadow: inset 0 0 0 1px var(--border);
    color: var(--text-muted);
    font-size: var(--text-xs);
    line-height: 18px;
    vertical-align: 1px;
  }
  .empty {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    color: var(--text-muted);
  }
  .empty p {
    margin: 0;
  }
  @media (max-width: 720px) {
    .page {
      padding: 20px 16px 32px;
    }
    .hide-sm {
      display: none;
    }
  }
</style>
