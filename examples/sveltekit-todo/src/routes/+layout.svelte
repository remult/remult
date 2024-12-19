<script lang="ts">
  import { Remult, remult } from 'remult'
  import '../app.css'
  import { createSubscriber } from 'svelte/reactivity'

  interface Props {
    data: import('./$types').LayoutData
    children?: import('svelte').Snippet
  }

  let { data, children }: Props = $props()

  remult.user = data.user

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

<svelte:head>
  <title>Remult+Sveltekit Todo App</title>
</svelte:head>

{@render children?.()}
