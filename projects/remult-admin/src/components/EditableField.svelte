<script lang="ts">
  import type {
    EntityRelationToManyInfo,
    EntityUIInfo,
    FieldUIInfo,
  } from '../../../core/server/remult-admin'
  import { God } from '../God'

  export let value: any
  export let info: FieldUIInfo
  const rmvWarning = info
</script>

<input bind:value on:change />
