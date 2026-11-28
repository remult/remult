<script lang="ts">
  import {
    Dialog,
    DialogBackdrop,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogTitle,
  } from '@ui-sdk/svelte/dialog'
  import {
    accessRow,
    PREFILTER_HINT,
    READ_HINT,
    userExtras,
    userRoles,
  } from '../core/access.js'
  import { god } from '../core/god.svelte.js'
  import { session, settings } from '../core/settings.svelte.js'
  import AccessLegend from './AccessLegend.svelte'
  import AccessMark from './AccessMark.svelte'
  import Avatar from './Avatar.svelte'
  import Icon from './Icon.svelte'
  import MiddleText from './MiddleText.svelte'
  import { entityHref, shell } from './shell.svelte.js'

  const user = $derived(god.user)
  const roles = $derived(userRoles(user))
  const extras = $derived(userExtras(user))
  const rows = $derived(
    god.visibleTables.map((t) => accessRow(t, session.forbiddenEntities)),
  )
  const label = (r: { caption: string; key: string }) =>
    settings.displayCaption ? r.caption : r.key

  const columns = [
    ['create', 'Create'],
    ['read', 'Read'],
    ['update', 'Update'],
    ['delete', 'Delete'],
  ] as const

  function changeToken() {
    shell.accessOpen = false
    shell.settingsOpen = true
  }
</script>

<Dialog bind:open={shell.accessOpen}>
  <DialogBackdrop class="scrim" />
  <DialogContent class="access">
    <header class="head">
      <div>
        <DialogTitle class="title">Your access</DialogTitle>
        <DialogDescription class="desc"
          >What the server lets this token see and do.</DialogDescription
        >
      </div>
      <DialogClose
        class="btn"
        data-variant="ghost"
        data-icon
        aria-label="Close your access"
      >
        <Icon name="x" />
      </DialogClose>
    </header>

    <div class="body">
      <section class="who" aria-label="User">
        <Avatar name={user?.name ?? (user ? user.id : undefined)} size={40} />
        <div class="id-block">
          {#if user}
            <span class="name" data-testid="access-name"
              >{user.name ?? user.id}</span
            >
            <span class="uid"><span class="k">id</span> {user.id}</span>
          {:else}
            <span class="name" data-testid="access-name">Anonymous</span>
            <span class="uid">No user for this token.</span>
          {/if}
        </div>
        <button class="btn" type="button" onclick={changeToken}>
          <Icon name="key" size={14} /> Change token
        </button>
      </section>

      {#if user}
        <section class="section" aria-labelledby="access-roles">
          <h3 id="access-roles">Roles</h3>
          {#if roles.length}
            <ul class="chips" aria-labelledby="access-roles">
              {#each roles as role (role)}
                <li class="chip">{role}</li>
              {/each}
            </ul>
          {:else}
            <p class="none">No roles</p>
          {/if}
        </section>

        {#if extras.entries.length}
          <section class="section" aria-labelledby="access-extras">
            <h3 id="access-extras">Other user info</h3>
            <dl class="kv">
              {#each extras.entries as [k, v] (k)}
                <dt>{k}</dt>
                <dd title={v}>{v}</dd>
              {/each}
            </dl>
            {#if extras.more}
              <p class="none">and {extras.more} more</p>
            {/if}
          </section>
        {/if}
      {/if}

      <section class="section" aria-labelledby="access-entities">
        <h3 id="access-entities">Entities</h3>
        {#if rows.length}
          <table class="matrix" aria-labelledby="access-entities">
            <thead>
              <tr>
                <th scope="col">Entity</th>
                {#each columns as [key, text] (key)}
                  <th scope="col" title={key === 'read' ? READ_HINT : undefined}
                    >{text}{#if key === 'read'}
                      <span class="sub">(prefilter)</span>{/if}</th
                  >
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each rows as r (r.superKey)}
                <tr style:--hue={r.color}>
                  <th scope="row">
                    <span class="entity">
                      <a
                        href={entityHref(r.superKey)}
                        onclick={() => (shell.accessOpen = false)}
                      >
                        <span class="hue-dot"></span>
                        <span class="caption"
                          ><MiddleText text={label(r)} /></span
                        >
                      </a>
                    </span>
                  </th>
                  {#each columns as [key] (key)}
                    <td
                      >{#if key === 'read'}<AccessMark
                          state={r.read}
                          icon={r.prefilter ? 'filter' : 'check'}
                          hint={r.prefilter && r.read === 'yes'
                            ? PREFILTER_HINT
                            : undefined}
                        />{:else}<AccessMark
                          state={r[key]}
                          rule={r.rules[key]}
                        />{/if}</td
                    >
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
          <AccessLegend />
        {:else}
          <p class="none">No entity is shown to you.</p>
        {/if}
      </section>
    </div>
  </DialogContent>
</Dialog>

<style>
  .sub {
    font-weight: 400;
    opacity: 0.75;
  }
  :global(.access) {
    position: fixed;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    display: flex;
    flex-direction: column;
    width: min(600px, calc(100vw - 32px));
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
  :global(.access:is([data-starting-style], [data-ending-style])) {
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
  :global(.access .title) {
    margin: 0;
    font-size: var(--text-lg);
    font-weight: 600;
  }
  :global(.access .desc) {
    margin: 2px 0 0;
    color: var(--text-muted);
    font-size: var(--text-sm);
  }
  .body {
    overflow-y: auto;
    padding: 0 20px 4px;
  }
  .who {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 0;
    border-top: 1px solid var(--border);
  }
  .id-block {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: var(--text-lg);
    font-weight: 600;
  }
  .uid {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--text-muted);
    font-family: var(--mono);
    font-size: var(--text-sm);
  }
  .uid .k {
    color: var(--text-faint);
  }
  .section {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px 0 18px;
    border-top: 1px solid var(--border);
  }
  h3 {
    margin: 0;
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--text-muted);
  }
  .none {
    margin: 0;
    color: var(--text-faint);
    font-size: var(--text-sm);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .chip {
    padding: 0 8px;
    border-radius: 10px;
    background: var(--accent-soft);
    color: var(--accent);
    font-family: var(--mono);
    font-size: var(--text-sm);
    line-height: 20px;
  }
  .kv {
    display: grid;
    grid-template-columns: max-content minmax(0, 1fr);
    gap: 4px 16px;
    margin: 0;
    font-size: var(--text-sm);
  }
  .kv dt {
    color: var(--text-muted);
  }
  .kv dd {
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: var(--mono);
  }
  .matrix {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }
  .matrix thead th {
    height: 28px;
    padding: 0 10px;
    background: var(--bg-inset);
    border-bottom: 1px solid var(--border);
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--text-muted);
    text-align: start;
    white-space: nowrap;
  }
  .matrix tbody th,
  .matrix td {
    height: 32px;
    padding: 0 10px;
    border-bottom: 1px solid var(--border);
    text-align: start;
    font-weight: 400;
  }
  .matrix tbody tr:last-child > * {
    border-bottom: 0;
  }
  .matrix tbody tr:hover {
    background: var(--bg-hover);
  }
  .matrix td {
    width: 68px;
    text-align: center;
  }
  .matrix thead th:not(:first-child) {
    text-align: center;
  }
  .entity {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .entity a {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    color: var(--text);
    font-weight: 500;
    text-decoration: none;
  }
  .entity a:hover .caption {
    text-decoration: underline;
    text-underline-offset: 3px;
    text-decoration-color: var(--border-strong);
  }
  .caption {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  @media (max-width: 520px) {
    .who .btn {
      display: none;
    }
    .matrix td {
      width: auto;
    }
  }
</style>
