<script lang="ts">
  let { value = $bindable(), ...props } = $props()

  // export let value: any
  // export let info: FieldUIInfo
</script>

<input bind:value {...props} />
<!-- on:Change -->
