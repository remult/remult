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
    viewBox="0 0 512 512"
  >
    <path
      fill="currentColor"
      d="M386.399 35.508C217.06-64.061 1.885 57.55.012 253.882c-1.828 191.716 201.063 315.545 370.02 231.163L185.56 213.636v167.997c0 18.614-35.619 18.614-35.619 0V156.421c0-14.776 27.448-15.989 35.226-3.145L395.43 470.572c157.95-101.737 155.817-338.136-9.031-435.064m-23.756 317.939L326.91 298.87V149.458c0-13.932 35.732-13.932 35.732 0z"
    />
  </svg>
</template>
