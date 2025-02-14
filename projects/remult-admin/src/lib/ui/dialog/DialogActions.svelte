<script lang="ts">
  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();
</script>

<div class="actions">
  {@render children?.()}
</div>

<style>
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;

    margin-top: 1.5rem;
  }
</style>
