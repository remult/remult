<script setup lang="ts">
import Editor from './Editor.vue'
import Icon from '../Icon.vue'
import { ref, onMounted, onUnmounted } from 'vue'

const texts = [
  'Auto API',
  'Validation',
  'ORM',
  'Typesafety',
  'Authorization',
  'Lifecycle hooks',
  'Real Time',
  'Admin UI',
  'Offline Support',
  'Full',
]
const currentText = ref(texts[0])
const colors = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#8262E1',
  '#FFD166',
  '#06D6A0',
  '#EF476F',
  '#118AB2',
  '#073B4C',
  '#7209B7',
]
const isShaking = ref(false)

let interval: number | null = null

const shake = () => {
  isShaking.value = true
  setTimeout(() => {
    isShaking.value = false
  }, 500)
}

onMounted(() => {
  let index = 0
  const normalDuration = 2000 // 2 seconds for normal items
  const lastItemDuration = 6000 // 6 seconds for the last item (3x longer)

  const updateText = () => {
    index = (index + 1) % texts.length
    currentText.value = texts[index]
    shake()

    // If we're at the last item, wait longer
    const duration =
      index === texts.length - 1 ? lastItemDuration : normalDuration
    interval = window.setTimeout(updateText, duration)
  }

  interval = window.setTimeout(updateText, normalDuration)
})

onUnmounted(() => {
  if (interval) {
    clearTimeout(interval)
  }
})
</script>

<template>
  <div class="intro">
    <div class="title">
      <div class="title-left">
      <h1>
        Adding
        <span
          :class="['rotating-text', currentText, { shake: isShaking }]"
          :style="{ backgroundColor: colors[texts.indexOf(currentText)] }"
          >{{ currentText }}</span
        >
        to your <i><small>full-</small></i
        >stack
      </h1>

        <div class="cta">
          <a href="/">Try in Browser</a>
          <a href="/docs">Documentation</a>
        </div>
      </div>

      <div class="title-right">
        <p>
        Want to see remult in action in 60 sec?<br>
        Auth, DB, CRUD – using your stack.<br>
        <code>npm init remult@latest</code>
        </p>
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
      <Icon tech="express" link="/docs/installation/server/express" />
      <Icon tech="fastify" link="/docs/installation/server/fastify" />
      <Icon tech="hono" link="/docs/installation/server/hono" />
      <Icon tech="hapi" link="/docs/installation/server/hapi" />
      <Icon tech="koa" link="/docs/installation/server/koa" />
      <Icon tech="nest" link="/docs/installation/server/nest" />
      <Icon tech="postgres" link="/docs/installation/database/postgresql" />
      <Icon tech="mysql" link="/docs/installation/database/mysql" />
      <Icon tech="mongodb" link="/docs/installation/database/mongodb" />
      <Icon tech="sqlite" link="/docs/installation/database/better-sqlite3" />
      <Icon tech="sqljs" link="/docs/installation/database/sqljs" />
      <Icon tech="mssql" link="/docs/installation/database/mssql" />
      <Icon tech="bun-sqlite" link="/docs/installation/database/bun-sqlite" />
      <Icon tech="turso" link="/docs/installation/database/turso" />
      <Icon tech="duckdb" link="/docs/installation/database/duckdb" />
      <Icon tech="oracle" link="/docs/installation/database/oracle" />
    </div>
    <div class="intro-logos-claim">Works with your favorite stack</div>
  </div>
</template>

<style>
.intro {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.title {
  display: flex;
  flex-direction: row;
  align-items: space-between;
  justify-content: space-between;

  width: 100%;
  max-width: 900px;
}

.title-left {
  text-align: left;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;

  h1 {
    margin-bottom: 0;
  }
}

.title-right {
  text-align: right;

  p {
    font-size: .8rem;
    line-height: 1.4;
  }
}

.intro-logos {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
  margin-bottom: 0.5rem;

  svg,
  img {
    width: auto;
    height: 24px;
  }

  span {
    display: none;
  }
}

.intro-logos-claim {
  font-size: 0.8rem;
  color: #8262e1;
  margin-bottom: 2rem;
}

.rotating-text {
  display: inline-block;
  min-width: 60px;
  text-align: center;
  padding: 0 8px;
  border-radius: 4px;
  color: white;
  transition: background-color 0.3s ease;
}

.rotating-text.full {
  min-width: 80px;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-2px);
  }
  20%,
  40%,
  60%,
  80% {
    transform: translateX(2px);
  }
}

.shake {
  animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}
</style>
