<script setup lang="ts">
import Editor from './Editor.vue'
import Icon from '../Icon.vue'
</script>

<template>
  <div class="intro">
    <div class="title">
      <h1>
        Adding full to your <i><small>full-</small></i
        >stack
      </h1>

      <div class="cta">
        <a href="/">Try in Browser</a>
        <a href="/docs">Documentation</a>
      </div>
    </div>

    <div class="editor-container">
      <Editor />
    </div>

    <div class="intro-logos">
      <Icon tech="react" link="/docs/installation/framework/react" />
      <Icon tech="angular" link="/docs/installation/framework/angular" />
      <Icon tech="vue" link="/docs/installation/framework/vue" />
      <Icon tech="nextjs" link="/docs/installation/framework/nextjs" />
      <Icon tech="svelte" link="/docs/installation/framework/sveltekit" />
      <Icon tech="nuxt" link="/docs/installation/framework/nuxt" />
      <Icon tech="solid" link="/docs/installation/framework/solid" />
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

.intro-logos {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
  svg {
    width: 32px;
    height: 32px;
  }
}
</style>
