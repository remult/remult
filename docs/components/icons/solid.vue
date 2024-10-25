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
    viewBox="0 0 128 128"
  >
    <defs>
      <linearGradient
        id="deviconSolidjs0"
        x1="27.5"
        x2="152"
        y1="3"
        y2="63.5"
        gradientTransform="translate(-3.22 1.507)scale(.80503)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset=".1" stop-color="#76b3e1" />
        <stop offset=".3" stop-color="#dcf2fd" />
        <stop offset="1" stop-color="#76b3e1" />
      </linearGradient>
      <linearGradient
        id="deviconSolidjs1"
        x1="95.8"
        x2="74"
        y1="32.6"
        y2="105.2"
        gradientTransform="translate(-3.22 1.507)scale(.80503)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stop-color="#76b3e1" />
        <stop offset=".5" stop-color="#4377bb" />
        <stop offset="1" stop-color="#1f3b77" />
      </linearGradient>
      <linearGradient
        id="deviconSolidjs2"
        x1="18.4"
        x2="144.3"
        y1="64.2"
        y2="149.8"
        gradientTransform="translate(-3.22 1.507)scale(.80503)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stop-color="#315aa9" />
        <stop offset=".5" stop-color="#518ac8" />
        <stop offset="1" stop-color="#315aa9" />
      </linearGradient>
      <linearGradient
        id="deviconSolidjs3"
        x1="75.2"
        x2="24.4"
        y1="74.5"
        y2="260.8"
        gradientTransform="translate(-3.22 1.507)scale(.80503)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stop-color="#4377bb" />
        <stop offset=".5" stop-color="#1a336b" />
        <stop offset="1" stop-color="#1a336b" />
      </linearGradient>
    </defs>
    <path
      fill="#76b3e1"
      d="M128 29.683S85.333-1.713 52.327 5.532l-2.415.805c-4.83 1.61-8.855 4.025-11.27 7.245l-1.61 2.415l-12.076 20.931l20.93 4.025c8.856 5.636 20.127 8.05 30.592 5.636l37.031 7.245z"
    />
    <path
      fill="url(#deviconSolidjs0)"
      d="M128 29.683S85.333-1.713 52.327 5.532l-2.415.805c-4.83 1.61-8.855 4.025-11.27 7.245l-1.61 2.415l-12.076 20.931l20.93 4.025c8.856 5.636 20.127 8.05 30.592 5.636l37.031 7.245z"
      opacity="0.3"
    />
    <path
      fill="#518ac8"
      d="m38.642 29.683l-3.22.805C21.735 34.513 17.71 47.394 24.955 58.664c8.05 10.465 24.956 16.1 38.641 12.076l49.912-16.906S70.843 22.438 38.642 29.683"
    />
    <path
      fill="url(#deviconSolidjs1)"
      d="m38.642 29.683l-3.22.805C21.735 34.513 17.71 47.394 24.955 58.664c8.05 10.465 24.956 16.1 38.641 12.076l49.912-16.906S70.843 22.438 38.642 29.683"
      opacity="0.3"
    />
    <path
      fill="url(#deviconSolidjs2)"
      d="M104.654 65.91a36.23 36.23 0 0 0-38.641-12.076L16.1 69.934L0 98.111l90.164 15.295l16.1-28.981c3.22-5.635 2.415-12.075-1.61-18.516z"
    />
    <path
      fill="url(#deviconSolidjs3)"
      d="M88.553 94.085A36.23 36.23 0 0 0 49.912 82.01L0 98.11s42.667 32.202 75.673 24.152l2.415-.806c13.686-4.025 18.516-16.905 10.465-27.37z"
    />
  </svg>
</template>
