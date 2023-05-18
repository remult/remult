<script lang="ts">
  import { remult } from "remult"
  import type { LayoutData } from "./$types"

  export let data: LayoutData

  // set this globaly
  remult.user = data.user
</script>

<slot />
