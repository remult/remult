<script lang="ts">
  import { Remult } from 'remult'
  import { createSubscriber } from 'svelte/reactivity'
  
  interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();

  // To be done once in the application.
  function initRemultSvelteReactivity() {
    Remult.entityRefInit = (x) => {
      let update = () => {}
      let s = createSubscriber((u) => {
        update = u
      })
      x.subscribe({
        reportObserved: () => s(),
        reportChanged: () => update(),
      })
    }
  }
  initRemultSvelteReactivity()
</script>

{@render children?.()}
