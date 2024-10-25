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
    viewBox="0 0 256 221"
  >
    <path
      fill="#41b883"
      d="M204.8 0H256L128 220.8L0 0h97.92L128 51.2L157.44 0z"
    />
    <path fill="#41b883" d="m0 0l128 220.8L256 0h-51.2L128 132.48L50.56 0z" />
    <path
      fill="#35495e"
      d="M50.56 0L128 133.12L204.8 0h-47.36L128 51.2L97.92 0z"
    />
  </svg>
</template>
