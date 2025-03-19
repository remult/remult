<script setup lang="ts">
import Intro from './homepage/Intro.vue';
import Examples from './homepage/Examples.vue';
</script>

<template>
  <div class="homepage">
    <Intro />
    <Examples />
  </div>
</template>


<style>
  .homepage {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  }

  .intro {
    padding: 8rem 0;
    width: 100%;
    margin: 0 auto;
    background: linear-gradient(
        to bottom,
        #000000 0%,
        #05052F 40%,
        #040664 75%,
        #7042B5 100%
    );
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
    background: #0D0D5B;
    color: #fff;
    padding: .5rem 2rem;
  }

  .VPContent.is-home {
    padding-top: 0 !important;
  }

  body:has(.homepage) .VPNavBar {
    background: transparent;
  }
</style>