<script lang="ts" module>
  import { toast as sdkToast } from '@ui-sdk/svelte/toast'

  export const toast = {
    success: (message: string) => sdkToast.success(message),
    info: (message: string) => sdkToast.info(message),
    // errors stay longer: they usually need reading
    error: (message: string) => sdkToast.error(message, { duration: 8000 }),
  }
</script>

<script lang="ts">
  import {
    Toast,
    ToastClose,
    ToastRegion,
    ToastTitle,
  } from '@ui-sdk/svelte/toast'
  import Icon from './Icon.svelte'
</script>

<!-- centred: the drawer footer and the pending bar sit in the corners -->
<ToastRegion
  side="bottom"
  align="center"
  maxVisible={4}
  aria-label="Notifications"
>
  {#snippet children(item)}
    <Toast class="toast">
      <span class="toast-icon" data-type={item.type}>
        <Icon
          name={item.type === 'error'
            ? 'error'
            : item.type === 'success'
              ? 'success'
              : 'info'}
          size={16}
        />
      </span>
      <ToastTitle class="toast-title" />
      <ToastClose class="toast-close" aria-label="Dismiss">
        <Icon name="x" size={14} />
      </ToastClose>
    </Toast>
  {/snippet}
</ToastRegion>

<style>
  :global([data-slot='toast-region']) {
    position: fixed;
    inset-inline-end: 16px;
    bottom: 16px;
    z-index: 50;
    width: min(360px, calc(100vw - 32px));
    height: var(--toast-front-height);
    transition: height 300ms var(--ease-out);
  }
  :global([data-slot='toast-region'][data-expanded]) {
    height: calc(var(--toast-stack-height) + (var(--toast-count) - 1) * 8px);
  }
  :global(.toast) {
    --y: calc(var(--toast-index) * -8px);
    position: absolute;
    inset-inline: 0;
    bottom: 0;
    z-index: calc(100 - var(--toast-index));
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 8px 10px 12px;
    overflow: hidden;
    height: var(--toast-height);
    border-radius: var(--radius-lg);
    background: var(--bg-raised);
    box-shadow:
      0 0 0 1px var(--border),
      var(--shadow-pop);
    translate: var(--toast-swipe-x, 0px)
      calc(var(--y) + var(--toast-swipe-y, 0px));
    scale: calc(1 - var(--toast-index) * 0.04);
    transition-property: translate, scale, opacity, height;
    transition-duration: 300ms;
    transition-timing-function: var(--ease-out);
    user-select: none;
  }
  :global(.toast:not([data-front], [data-expanded])) {
    height: var(--toast-front-height);
  }
  :global(.toast[data-expanded]) {
    --y: calc(-1 * (var(--toast-offset) + var(--toast-index) * 8px));
    scale: 1;
  }
  :global(.toast[data-starting-style]) {
    transition: none;
  }
  :global(.toast[data-starting-style][data-front]) {
    --y: 12px;
    opacity: 0;
  }
  :global(
    .toast:is([data-starting-style]:not([data-front]), [data-ending-style])
  ) {
    opacity: 0;
  }
  :global(.toast[data-ending-style]) {
    --y: 6px;
  }
  :global(.toast[data-swiping]) {
    transition: none;
  }
  .toast-icon {
    display: flex;
    padding-top: 1px;
    color: var(--text-muted);
  }
  .toast-icon[data-type='success'] {
    color: var(--success);
  }
  .toast-icon[data-type='error'] {
    color: var(--danger);
  }
  :global(.toast-title) {
    flex: 1;
    margin: 0;
    font-size: var(--text-md);
    font-weight: 500;
    line-height: 18px;
    overflow-wrap: anywhere;
    user-select: text;
  }
  :global(.toast-close) {
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    margin: -1px 0;
    border: 0;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-faint);
    cursor: pointer;
    transition:
      color 120ms var(--ease-out),
      background-color 120ms var(--ease-out);
  }
  :global(.toast-close:hover) {
    color: var(--text);
    background: var(--bg-hover);
  }
</style>
