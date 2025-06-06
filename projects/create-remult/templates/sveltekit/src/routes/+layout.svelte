<script lang="ts">
  import { remult, Remult } from 'remult'
  import { createSubscriber } from 'svelte/reactivity'

  interface Props {
    children?: import('svelte').Snippet
  }

  let { children }: Props = $props()

  // To be done once in the application.
  function initRemultSvelteReactivity() {
    // Auth reactivity (remult.user, remult.authenticated(), ...)
    {
      let update = () => {}
      let s = createSubscriber((u) => {
        update = u
      })
      remult.subscribeAuth({
        reportObserved: () => s(),
        reportChanged: () => update(),
      })
    }

    // Entities reactivity
    {
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
  }
  initRemultSvelteReactivity()
</script>

{@render children?.()}
