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
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="sizeIco"
    :height="sizeIco"
    viewBox="0 0 24 24"
  >
    <path fill="currentColor" d="M0 24h24V0H0v2.455h21.546v19.09H2.454V0H0Z" />
  </svg>
</template>
