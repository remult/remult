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
    padding: 4remgit;
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

  /* Editor Styles */
  .shiki.tokyo-night {
    background-color: #050638 !important;
    font-size: .8rem;
    line-height: 1.2rem;
  }

  .editor {
    color: #484BD2;
  }

  .editor-body {
    display: flex;
  }

  .editor-tabs {
    display: flex;
    gap: .2rem;
    background: #050638;
    border-bottom: #080A59;
    padding: .5rem;
  }

  .editor-tabs button {
    background: #050638;
    border: #080A59;
    padding: .5rem;
  }

  .editor-sidebar {
    width: 200px;
    background: #050638;
    border-right: #080A59;
    padding: .5rem;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    gap: .2rem;
  }

  .editor-code {
    padding: 0;
  }
</style>