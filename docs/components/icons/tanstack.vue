<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    sizeIco?: number
  }>(),
  {
    sizeIco: 50,
  },
)
</script>

<template>
  <img
    src="https://tanstack.com/_build/assets/logo-color-100w-lPbOTx1K.png"
    alt="tanstack logo"
    :width="sizeIco"
    :height="sizeIco"
  />
</template>
