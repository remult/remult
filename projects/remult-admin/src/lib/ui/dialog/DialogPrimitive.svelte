<script lang="ts">
  import { createDialog } from '@melt-ui/svelte'
  import { flyAndScale } from '../melt/utils.js'
  import { dialog, type DialogConfig } from './dialog.js'
  import { onDestroy, onMount, tick } from 'svelte'
  import DialogActions from './DialogActions.svelte'

  export let config: DialogConfig

  let animate = false
  onMount(() => {
    animate = true
  })

  onDestroy(() => {
    tick()
    animate = false
  })

  const {
    elements: { overlay, content, title, description, close, portalled },
  } = createDialog({
    defaultOpen: true,
    onOpenChange: (open) => {
      dialog.close({ success: false })
      return open.next
    },
  })
</script>

{#if animate}
  <div {...$portalled} use:portalled>
    <div {...$overlay} use:overlay class="overlay" />
    <div
      style="--dialog-width: {config.width ?? '550px'}"
      class="content"
      transition:flyAndScale={{
        duration: 150,
        y: 8,
        start: 0.96,
      }}
      {...$content}
      use:content
    >
      <h2 {...$title} use:title class="title">{config.title}</h2>

      <p {...$description} use:description class="description">
        {#if config.description}
          {config.description}
        {/if}
      </p>

      <div class="slot-content">
        <slot></slot>
      </div>

      {#if config.buttonSuccess}
        <DialogActions>
          <button
            {...$close}
            on:click={() => {
              dialog.close({ success: true })
            }}
            class={config.isWarning ? 'warning' : 'primary'}
          >
            {config.buttonSuccess}
          </button>
        </DialogActions>
      {/if}

      <button {...$close} use:close aria-label="close" class="close">
        <svg
          width="117"
          height="118"
          viewBox="0 0 117 118"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          ><rect
            x="0.163696"
            y="11.2703"
            width="15"
            height="150"
            transform="rotate(-45 0.163696 11.2703)"
            fill="#3230A3"
          /><rect
            x="106.23"
            y="0.663696"
            width="15"
            height="150"
            transform="rotate(45 106.23 0.663696)"
            fill="#3230A3"
          /></svg
        >
      </button>
    </div>
  </div>
{/if}

<style>
  /* Check where to put this */
  :global(:root) {
    --dialog-width: 550px;
    /* --color-inherit: inherit; */
    /* --color-current: currentColor; */
    /* --color-transparent: transparent; */

    --color-black: 0 0 0;
    --color-white: 255 255 255;

    /* --color-neutral-50: 250 250 250;
    --color-neutral-100: 245 245 245;
    --color-neutral-200: 229 229 229;
    --color-neutral-300: 212 212 212;
    --color-neutral-400: 163 163 163;
    --color-neutral-500: 115 115 115;
    --color-neutral-600: 82 82 82;
    --color-neutral-700: 64 64 64;
    --color-neutral-800: 38 38 38;
    --color-neutral-900: 23 23 23; */

    /* --color-indigo-50: 238 242 255; */
    --color-indigo-100: 224 231 255;
    /* --color-indigo-200: 199 210 254; */
    /* --color-indigo-300: 165 180 252; */
    --color-indigo-400: 129 140 248;
    /* --color-indigo-500: 99 102 241; */
    /* --color-indigo-600: 79 70 229; */
    --color-indigo-700: 67 56 202;
    --color-indigo-800: 55 48 163;
    --color-indigo-900: 49 46 129;
    /* --color-indigo-950: 30 27 75; */

    /* --color-magnum-50: 255 249 237; */
    --color-magnum-100: 254 242 214;
    /* --color-magnum-200: 252 224 172; */
    /* --color-magnum-300: 249 201 120; */
    --color-magnum-400: 247 177 85;
    /* --color-magnum-500: 243 141 28; */
    /* --color-magnum-600: 228 115 18; */
    --color-magnum-700: 189 87 17;
    --color-magnum-800: 150 69 22;
    --color-magnum-900: 121 58 21;
    /* --color-magnum-950: 65 28 9; */

    /* --color-zinc-50: 250 250 250; */
    --color-zinc-100: 244 244 245;
    /* --color-zinc-200: 228 228 231;
    --color-zinc-300: 212 212 216;
    --color-zinc-400: 161 161 170;
    --color-zinc-500: 113 113 122; */
    --color-zinc-600: 82 82 91;
    /* --color-zinc-700: 63 63 70;
    --color-zinc-800: 39 38 42;
    --color-zinc-900: 24 24 27; */

    /* --color-gray-50: 249 250 251;
    --color-gray-100: 243 244 246;
    --color-gray-200: 228 231 235;
    --color-gray-300: 209 213 219;
    --color-gray-400: 156 163 175;
    --color-gray-500: 107 114 128;
    --color-gray-600: 75 85 99;
    --color-gray-700: 55 65 81;
    --color-gray-800: 31 41 55;
    --color-gray-900: 17 24 39; */

    --font-family-sans: ui-sans-serif, system-ui, -apple-system,
      BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
      'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji',
      'Segoe UI Symbol', 'Noto Color Emoji';
    --font-family-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
      'Liberation Mono', 'Courier New', monospace;
  }

  .trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;

    padding: 0.5rem 1rem;

    border-radius: 0.375rem;

    background-color: rgb(var(--color-white) / 1);

    font-weight: 500;
    line-height: 1;

    color: rgb(var(--color-indigo-700) / 1);

    box-shadow:
      0 10px 15px -3px rgb(var(--color-black) / 0.1),
      0 4px 6px -4px rgb(var(--color-black) / 0.1);
  }

  .trigger:hover {
    opacity: 0.75;
  }

  .overlay {
    position: fixed;
    inset: 0;
    z-index: 40;

    background-color: rgb(var(--color-black) / 0.5);
  }

  .content {
    position: fixed;
    left: 50%;
    top: 50%;

    z-index: 50;

    min-height: 50vh;
    max-height: 85vh;
    width: 90vw;
    /* max-width: 550px; */
    max-width: var(--dialog-width);

    transform: translate(-50%, -50%);

    border-radius: 0.375rem;

    background-color: rgb(var(--color-white) / 1);

    padding: 1.5rem;

    box-shadow:
      0 10px 15px -3px rgb(var(--color-black) / 0.1),
      0 4px 6px -4px rgb(var(--color-black) / 0.1);
  }

  .content:focus {
    outline: 2px solid transparent;
    outline-offset: 2px;
  }

  .close {
    display: inline-flex;
    align-items: center;
    justify-content: center;

    position: absolute;
    right: 10px;
    top: 10px;

    appearance: none;

    height: 1.5rem;
    width: 1.5rem;
    padding: 0;

    border-radius: 9999px;

    color: rgb(var(--color-indigo-800) / 1);
  }

  .close svg {
    width: 0.7rem;
    height: 0.7rem;
  }

  .close:hover {
    background-color: rgb(var(--color-indigo-100) / 1);
  }

  .close:focus {
    outline: 2px solid transparent;
    outline-offset: 2px;

    box-shadow: 0px 0px 0px 3px rgb(var(--color-indigo-400) / 1);
  }

  .title {
    margin: 0;

    font-size: 1.125rem;
    line-height: 1.75rem;
    font-weight: 500;

    color: rgb(var(--color-black) / 1);
  }

  .description {
    margin-bottom: 1.25rem;
    margin-top: 0.5rem;

    line-height: 1.5;

    color: rgb(var(--color-zinc-600) / 1);
  }

  :global(button) {
    display: inline-flex;
    align-items: center;
    justify-content: center;

    height: 2rem;

    border-radius: 0.25rem;

    padding: 0 1rem;

    font-weight: 500;
    line-height: 1;
  }

  :global(button.warning) {
    background-color: rgb(var(--color-magnum-100) / 1);
    color: rgb(var(--color-magnum-900) / 1);
  }

  :global(button.primary) {
    background-color: rgb(var(--color-indigo-100) / 1);
    color: rgb(var(--color-indigo-900) / 1);
  }

  .slot-content {
    flex: 1;
    overflow-y: auto;
    max-height: calc(85vh - 12rem); /* Adjust this value as needed */
    margin-bottom: 1rem;
    padding-right: 16px; /* Add padding to prevent content from being hidden behind scrollbar */
    min-height: 50vh;
  }

  /* Styling for WebKit browsers (Chrome, Safari, newer versions of Edge) */
  .slot-content::-webkit-scrollbar {
    width: 8px;
  }

  .slot-content::-webkit-scrollbar-track {
    background: transparent;
  }

  .slot-content::-webkit-scrollbar-thumb {
    background-color: rgb(var(--color-zinc-300) / 0.5);
    border-radius: 4px;
    border: 2px solid transparent;
    background-clip: content-box;
  }

  .slot-content::-webkit-scrollbar-thumb:hover {
    background-color: rgb(var(--color-zinc-400) / 0.7);
  }

  /* Styling for Firefox */
  .slot-content {
    scrollbar-width: thin;
    scrollbar-color: rgb(var(--color-zinc-300) / 0.5) transparent;
  }

  /* ... rest of the existing styles ... */
</style>
