<script setup lang="ts">
import Icon from './Icon.vue'

const props = withDefaults(
  defineProps<{
    vite?: boolean | string
    vue?: boolean | string
    react?: boolean | string
    express?: boolean | string
    fastify?: boolean | string
    shadcn?: boolean | string
    tanstack?: boolean | string
    angular?: boolean | string
    svelte?: boolean | string
    nextjs?: boolean | string
    nuxt?: boolean | string
    bun?: boolean | string
    solid?: boolean | string
    json?: boolean | string
    postgres?: boolean | string
    mysql?: boolean | string
    mongodb?: boolean | string
    sqlite?: boolean | string
    mssql?: boolean | string
    mui?: boolean | string

    live?: string
    github?: string
    stackblitz?: string
    codesandbox?: string

    imgSrc?: string

    sizeIco?: number
  }>(),
  {
    sizeIco: 50,
  },
)
</script>

<template>
  <div class="container">
    <img
      v-if="imgSrc"
      :src="imgSrc"
      :alt="`screenshot`"
      width="250"
      height="250e"
    />

    <div class="techno">
      <div v-if="shadcn">
        <Icon tech="shadcn" :link="shadcn" />
      </div>

      <div v-if="tanstack">
        <Icon tech="tanstack" :link="tanstack" />
      </div>

      <div v-if="mui">
        <Icon tech="mui" :link="mui" />
      </div>

      <div v-if="react">
        <Icon tech="react" :link="react" />
      </div>

      <div v-if="angular">
        <Icon tech="angular" :link="angular" />
      </div>

      <div v-if="vue">
        <Icon tech="vue" :link="vue" />
      </div>

      <div v-if="vite">
        <Icon tech="vite" :link="vite" />
      </div>

      <div v-if="express">
        <Icon tech="express" :link="express" />
      </div>

      <div v-if="fastify">
        <Icon tech="fastify" :link="fastify" />
      </div>

      <div v-if="svelte">
        <Icon tech="svelte" :link="svelte" />
      </div>

      <div v-if="nextjs">
        <Icon tech="nextjs" :link="nextjs" />
      </div>

      <div v-if="nuxt">
        <Icon tech="nuxt" :link="nuxt" />
      </div>

      <div v-if="solid">
        <Icon tech="solid" :link="solid" />
      </div>

      <div v-if="bun">
        <Icon tech="bun" :link="bun" />
      </div>

      <div v-if="json">
        <Icon tech="json" :link="json" />
      </div>

      <div v-if="postgres">
        <Icon tech="postgres" :link="postgres" />
      </div>

      <div v-if="mysql">
        <Icon tech="mysql" :link="mysql" />
      </div>

      <div v-if="mongodb">
        <Icon tech="mongodb" :link="mongodb" />
      </div>

      <div v-if="sqlite">
        <Icon tech="sqlite" :link="sqlite" />
      </div>

      <div v-if="mssql">
        <Icon tech="mssql" />
      </div>
    </div>

    <div class="open">
      <div v-if="live">
        <Icon tech="live" :link="live" isShiny />
      </div>

      <div v-if="stackblitz">
        <Icon tech="stackblitz" :link="stackblitz" isShiny />
      </div>

      <div v-if="codesandbox">
        <Icon tech="codesandbox" :link="codesandbox" isShiny />
      </div>

      <div v-if="github">
        <Icon tech="github" :link="github" isShiny />
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-items: center;
  justify-content: space-between;
  gap: 2rem;
}

/* Media query for small devices */
@media (max-width: 768px) {
  .container {
    flex-direction: column;
  }
}

.techno {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  align-items: center;
  justify-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.open {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}
</style>
