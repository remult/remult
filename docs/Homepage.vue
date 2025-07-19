<script setup lang="ts">
import Intro from './components/homepage/Intro.vue'
import Examples from './components/homepage/Examples.vue'
import Remultor from './components/homepage/Remultor.vue'
import Faq from './components/homepage/Faq.vue'
</script>

<template>
  <div class="homepage vp-doc">
    <Intro />
    <Examples />
    <Remultor />
    <Faq />
  </div>
</template>

<style>
.homepage {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;

  h1,
  h2,
  h3 {
    border: none;
    padding-top: 0;
  }

  h1:first-of-type,
  h2:first-of-type,
  h3:first-of-type {
    margin-top: 0;
  }
}

.VPContent.is-home {
  padding-top: 0 !important;
}

body:has(.homepage) .VPNavBar {
  background: transparent;
}
</style>
