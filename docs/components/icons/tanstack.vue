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
    src="/tanstack_logo.png"
    alt="tanstack logo"
    :width="sizeIco"
    :height="sizeIco"
  />
</template>
