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
    <path
      fill="currentColor"
      d="M12 0C5.363 0 0 5.363 0 12s5.363 12 12 12s12-5.363 12-12S18.637 0 12 0M9.502 7.03a4.974 4.974 0 0 1 4.97 4.97a4.974 4.974 0 0 1-4.97 4.97A4.974 4.974 0 0 1 4.532 12a4.974 4.974 0 0 1 4.97-4.97m6.563 3.183h2.351c.98 0 1.787.782 1.787 1.762s-.807 1.789-1.787 1.789h-2.351z"
    />
  </svg>
</template>
