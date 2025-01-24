<script setup lang="ts">
import Editor from './Editor.vue'
</script>

<template>
  <div class="homepage">

    <div class="intro">
      <div class="title">
        <h1>Adding full to your stack</h1>
        
        <div class="cta">
          <a href="/">Try in Browser</a>
          <a href="/docs">Documentation</a>
        </div>
      </div>
      
      <Editor />
    </div>

  </div>
</template>


<style>
  .homepage {
    padding: 4rem;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(
        to bottom,
        #000000 0%,
        #05052F 40%,
        #040664 75%,
        #7042B5 100%
    );
  }

  .intro {
    max-width: 800px;
    width: 100%;
    margin: 0 auto;
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
