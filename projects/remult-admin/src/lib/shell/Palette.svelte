<script lang="ts">
  import { goto } from '$app/navigation'
  import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandGroupLabel,
    CommandInput,
    CommandItem,
    CommandItemText,
    CommandList,
  } from '@ui-sdk/svelte/command'
  import {
    Dialog,
    DialogBackdrop,
    DialogContent,
    DialogShortcut,
    DialogTitle,
    DialogTrigger,
  } from '@ui-sdk/svelte/dialog'
  import { god } from '../core/god.svelte.js'
  import { session, settings } from '../core/settings.svelte.js'
  import Icon from './Icon.svelte'
  import { entityHref, shell } from './shell.svelte.js'

  let { compact = false }: { compact?: boolean } = $props()

  // settings opens once the palette is gone, so focus lands in the settings dialog, not back on the trigger
  let afterClose: (() => void) | undefined

  function onAction(value: string) {
    if (value.startsWith('entity:')) goto(entityHref(value.slice(7)))
    else if (value === 'schema') goto('#/schema')
    else if (value === 'settings') afterClose = () => (shell.settingsOpen = true)
    shell.paletteOpen = false
  }
</script>

<Dialog
  bind:open={shell.paletteOpen}
  onOpenChangeComplete={(open) => {
    if (open) return
    afterClose?.()
    afterClose = undefined
  }}
>
  <DialogTrigger
    shortcut="mod+k"
    class={compact ? 'btn palette-trigger compact' : 'btn palette-trigger'}
    data-variant="ghost"
    aria-label={compact ? 'Go to' : undefined}
  >
    <Icon name="search" size={15} />
    {#if !compact}
      <span class="trigger-label">Go to...</span>
      <DialogShortcut>
        {#snippet render({ props, state })}
          <kbd {...props}>{state.text}</kbd>
        {/snippet}
      </DialogShortcut>
    {/if}
  </DialogTrigger>
  <DialogBackdrop class="scrim" />
  <DialogContent class="palette">
    <DialogTitle class="sr-only">Go to</DialogTitle>
    <Command {onAction} loop>
      <div class="palette-search">
        <Icon name="search" size={16} />
        <CommandInput
          class="palette-input"
          aria-label="Search entities and actions"
          placeholder="Search entities, schema, settings"
        />
        <kbd>Esc</kbd>
      </div>
      <CommandEmpty class="palette-empty">
        {#snippet children(state)}
          {#if state.empty}No match for "{state.query}".{/if}
        {/snippet}
      </CommandEmpty>
      <CommandList class="palette-list">
        <CommandGroup>
          <CommandGroupLabel class="palette-group">Entities</CommandGroupLabel>
          {#each god.visibleTables as t (t.superKey)}
            {@const label = settings.displayCaption ? t.caption : t.key}
            <CommandItem
              value={'entity:' + t.superKey}
              {label}
              keywords={[t.caption, t.key]}
              class="palette-item"
            >
              <span class="hue-dot" style:--hue={t.color}></span>
              <CommandItemText class="palette-text" />
              {#if session.forbiddenEntities.includes(t.key)}
                <span class="palette-meta"><Icon name="lock" size={13} /> Forbidden</span>
              {:else if settings.displayCaption && t.caption !== t.key}
                <span class="palette-meta mono">{t.key}</span>
              {/if}
            </CommandItem>
          {/each}
        </CommandGroup>
        <CommandGroup>
          <CommandGroupLabel class="palette-group">Go to</CommandGroupLabel>
          <CommandItem value="schema" label="Schema" keywords={['diagram', 'erd']} class="palette-item">
            <Icon name="schema" size={15} />
            <CommandItemText class="palette-text" />
          </CommandItem>
          <CommandItem
            value="settings"
            label="Settings"
            keywords={['token', 'theme', 'preferences']}
            class="palette-item"
          >
            <Icon name="settings" size={15} />
            <CommandItemText class="palette-text" />
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
    <footer class="palette-foot">
      <span><kbd>↑</kbd> <kbd>↓</kbd> move</span>
      <span><kbd>Enter</kbd> open</span>
    </footer>
  </DialogContent>
</Dialog>

<style>
  :global(.palette-trigger) {
    width: 100%;
    justify-content: flex-start;
    color: var(--text-muted);
    padding: 0 6px 0 8px;
  }
  :global(.palette-trigger.compact) {
    width: 32px;
    height: 32px;
    padding: 0;
    justify-content: center;
  }
  .trigger-label {
    flex: 1;
    text-align: start;
  }

  :global(.scrim) {
    position: fixed;
    inset: 0;
    background: var(--scrim);
    transition: opacity 150ms var(--ease-out);
  }
  :global(.scrim:is([data-starting-style], [data-ending-style])) {
    opacity: 0;
  }

  :global(.palette) {
    position: fixed;
    top: min(16vh, 140px);
    left: 50%;
    translate: -50% 0;
    width: min(560px, calc(100vw - 32px));
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: 12px;
    background: var(--bg-raised);
    color: var(--text);
    box-shadow:
      0 0 0 1px var(--border),
      var(--shadow-pop);
    overflow: hidden;
    transition:
      opacity 150ms var(--ease-out),
      scale 150ms var(--ease-out);
  }
  :global(.palette:is([data-starting-style], [data-ending-style])) {
    opacity: 0;
    scale: 0.98;
  }
  .palette-search {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 12px 0 14px;
    height: 48px;
    border-bottom: 1px solid var(--border);
    color: var(--text-muted);
  }
  :global(.palette-input) {
    flex: 1;
    height: 100%;
    border: 0;
    outline: 0;
    background: transparent;
    font-size: var(--text-lg);
    color: var(--text);
  }
  :global(.palette-input::placeholder) {
    color: var(--text-faint);
  }
  :global(.palette-list) {
    max-height: min(52vh, 420px);
    overflow-y: auto;
    padding: 4px 6px 6px;
    scroll-padding-block: 30px 6px;
  }
  :global(.palette-group) {
    padding: 10px 8px 4px;
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--text-faint);
  }
  :global(.palette-item) {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 34px;
    padding: 0 10px;
    border-radius: 8px;
    color: var(--text);
    cursor: pointer;
  }
  :global(.palette-item[data-highlighted]) {
    background: var(--bg-hover);
  }
  :global(.palette-item > svg) {
    color: var(--text-muted);
  }
  :global(.palette-item .hue-dot) {
    margin-inline: 4px;
  }
  :global(.palette-text) {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  :global(.palette-text mark) {
    background: none;
    color: inherit;
    font-weight: 650;
  }
  .palette-meta {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: var(--text-sm);
    color: var(--text-faint);
  }
  .mono {
    font-family: var(--mono);
    font-size: var(--text-xs);
  }
  :global(.palette-empty[data-empty]) {
    padding: 28px 16px;
    text-align: center;
    color: var(--text-muted);
  }
  .palette-foot {
    display: flex;
    gap: 16px;
    padding: 8px 14px;
    border-top: 1px solid var(--border);
    background: var(--bg-inset);
    font-size: var(--text-xs);
    color: var(--text-faint);
  }
</style>
