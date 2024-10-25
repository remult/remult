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
    viewBox="0 0 32 32"
  >
    <path
      fill="#00DC82"
      d="M17.708 25h10.409c.33 0 .655-.088.942-.254a1.9 1.9 0 0 0 .689-.696a1.91 1.91 0 0 0 0-1.9L22.756 9.936a1.87 1.87 0 0 0-3.261 0l-1.788 3.125l-3.494-6.111a1.871 1.871 0 0 0-3.262 0l-8.7 15.2a1.91 1.91 0 0 0 .69 2.595c.286.167.61.255.941.255h6.534c2.589 0 4.498-1.147 5.811-3.385l3.19-5.572l1.708-2.982l5.127 8.957h-6.835zm-7.398-2.985l-4.56-.001l6.836-11.942l3.41 5.97l-2.283 3.992c-.873 1.452-1.864 1.981-3.403 1.981"
    />
  </svg>
</template>
