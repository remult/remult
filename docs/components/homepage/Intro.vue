<script setup lang="ts">
import Editor from '../Editor.vue'
</script>

<template>
    <div class="intro">
      <div class="title">
        <h1>Adding full to your stack</h1>
        
        <div class="cta">
          <a href="/">Try in Browser</a>
          <a href="/docs">Documentation</a>
        </div>
      </div>
      
      <div class="editor-container">
        <Editor />
      </div>
    </div>
</template>

<style>
    .intro {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
</style>
