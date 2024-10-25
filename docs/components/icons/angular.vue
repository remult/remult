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
    viewBox="0 0 256 271"
  >
    <defs>
      <linearGradient
        id="logosAngularIcon0"
        x1="25.071%"
        x2="96.132%"
        y1="90.929%"
        y2="55.184%"
      >
        <stop offset="0%" stop-color="#e40035" />
        <stop offset="24%" stop-color="#f60a48" />
        <stop offset="35.2%" stop-color="#f20755" />
        <stop offset="49.4%" stop-color="#dc087d" />
        <stop offset="74.5%" stop-color="#9717e7" />
        <stop offset="100%" stop-color="#6c00f5" />
      </linearGradient>
      <linearGradient
        id="logosAngularIcon1"
        x1="21.863%"
        x2="68.367%"
        y1="12.058%"
        y2="68.21%"
      >
        <stop offset="0%" stop-color="#ff31d9" />
        <stop offset="100%" stop-color="#ff5be1" stop-opacity="0" />
      </linearGradient>
    </defs>
    <path
      fill="url(#logosAngularIcon0)"
      d="m256 45.179l-9.244 145.158L158.373 0zm-61.217 187.697l-66.782 38.105l-66.784-38.105L74.8 199.958h106.4zM128.001 72.249l34.994 85.076h-69.99zM9.149 190.337L0 45.179L97.627 0z"
    />
    <path
      fill="url(#logosAngularIcon1)"
      d="m256 45.179l-9.244 145.158L158.373 0zm-61.217 187.697l-66.782 38.105l-66.784-38.105L74.8 199.958h106.4zM128.001 72.249l34.994 85.076h-69.99zM9.149 190.337L0 45.179L97.627 0z"
    />
  </svg>
</template>
