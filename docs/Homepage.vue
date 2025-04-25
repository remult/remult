<script setup lang="ts">
import Intro from './components/homepage/Intro.vue'
import Examples from './components/homepage/Examples.vue'
import Faq from './components/homepage/Faq.vue'
</script>

<template>
  <div class="homepage vp-doc">
    <Intro />
    <Examples />
    <Faq />
  </div>
</template>

<style>
.homepage {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}

.intro {
  position: relative;
  padding: 8rem 0 0 0;
  width: 100%;
  margin: 0 auto;
  margin-top: auto;
  background: linear-gradient(
    to bottom,
    #000000 0%,
    #05052f 40%,
    #040664 75%,
    #7042b5 100%
  );
  border-radius: 0 0 1rem 1rem;

  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 50px;
    opacity: 0;
    background: linear-gradient(
      to top,
      rgba(4, 6, 100, 1) 100%,
      rgba(112, 66, 181, 1) 10%
    );
  }
}

.title {
  text-align: center;
  margin-bottom: 2rem;
}

h1 {
  font-size: 2rem;
  margin-bottom: 2rem;
}

.cta {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.cta a {
  display: inline-block;
  background: #0d0d5b;
  color: #fff;
  padding: 0.5rem 2rem;
}

.VPContent.is-home {
  padding-top: 0 !important;
}

body:has(.homepage) .VPNavBar {
  background: transparent;
}
</style>
