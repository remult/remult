<script lang="ts">
  import { remult } from "remult";
  import "../app.css"

  interface Props {
    data: import('./$types').LayoutData;
    children?: import('svelte').Snippet;
  }

  let { data, children }: Props = $props();

  $effect(() => {
    remult.user = data.user;
  });
</script>

<svelte:head>
  <title>Remult+Sveltekit Todo App</title>
</svelte:head>

{@render children?.()}