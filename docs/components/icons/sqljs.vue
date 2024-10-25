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
    <g
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="1.5"
      color="currentColor"
    >
      <path
        d="M2.5 12c0-4.478 0-6.718 1.391-8.109S7.521 2.5 12 2.5c4.478 0 6.718 0 8.109 1.391S21.5 7.521 21.5 12c0 4.478 0 6.718-1.391 8.109S16.479 21.5 12 21.5c-4.478 0-6.718 0-8.109-1.391S2.5 16.479 2.5 12"
      />
      <path
        d="M8.415 10A1.5 1.5 0 1 0 7 12a1.5 1.5 0 1 1-1.415 2m6.915 1a1.5 1.5 0 0 1-1.5-1.5v-3a1.5 1.5 0 0 1 3 0v3a1.5 1.5 0 0 1-1.5 1.5m0 0l1.5 1.5M16.5 9v4c0 .943 0 1.414.293 1.707S17.557 15 18.5 15"
      />
    </g>
  </svg>
</template>
