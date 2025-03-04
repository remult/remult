<script lang="ts">
  import { LSContext } from '../lib/stores/LSContext.js'
  import { godStore } from '../stores/GodStore.js'
  import { push } from 'svelte-spa-router'

  if ($LSContext.currentLocationHash === '/') {
    push(
      $godStore?.tables.length > 0
        ? `/entity/${$godStore.tables[0].superKey}`
        : '/diagram',
    )
  } else {
    push($LSContext.currentLocationHash)
  }
</script>

Loading...
