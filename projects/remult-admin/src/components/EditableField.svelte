<script lang="ts">
  import type {
    EntityRelationToManyInfo,
    EntityUIInfo,
    FieldUIInfo,
  } from '../../../core/server/remult-admin'
  import { God } from '../God'

  let { value = $bindable(), ...props } = $props()

  // export let value: any
  // export let info: FieldUIInfo
</script>

<input bind:value {...props} />
<!-- on:Change -->
