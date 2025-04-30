<script setup lang="ts">
import Editor from './Editor.vue'
import Icon from '../Icon.vue'
import { ref, onMounted, onUnmounted } from 'vue'

const features = [
  { text: 'Auto API', bgColor: '#FF31D9', textColor: '#7D1369' },
  { text: 'Validation', bgColor: '#327C98', textColor: '#9ED9F0' },
  { text: 'Typesafe ORM', bgColor: '#51319E', textColor: '#BDA1FF' },
  { text: 'Authorization', bgColor: '#2CA171', textColor: '#0D5337' },
  { text: 'Lifecycle hooks', bgColor: '#050643', textColor: '#7173F2' },
  { text: 'Real Time', bgColor: '#538CC9', textColor: '#184472' },
  { text: 'Typesafety', bgColor: '#8262E1', textColor: '#FFFFFF' },
  { text: 'Admin UI', bgColor: '#00D8FF', textColor: '#266F7C' },
  { text: 'Offline Support', bgColor: '#A91D23', textColor: '#FF979B' },
  { text: 'full', bgColor: '#51319E', textColor: '#BDA1FF' },
]

const currentFeature = ref(features[0])
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
    index = (index + 1) % features.length
    currentFeature.value = features[index]
    shake()

    // If we're at the last item, wait longer
    const duration =
      index === features.length - 1 ? lastItemDuration : normalDuration
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
          :class="['rotating-text', currentFeature.text.toLowerCase(), { shake: isShaking }]"
          :style="{ backgroundColor: currentFeature.bgColor, color: currentFeature.textColor }"
          >{{ currentFeature.text }}</span
        >
        to your full-stack
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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 50px;
    opacity: 0;
    pointer-events: none;
    background: linear-gradient(
      to top,
      rgba(4, 6, 100, 1) 100%,
      rgba(112, 66, 181, 1) 10%
    );
  }
}

.intro .title {
  display: flex;
  flex-direction: row;
  align-items: space-between;
  justify-content: space-between;
  width: 100%;
  max-width: 900px;
  text-align: center;
  margin-bottom: 2rem;
}

.intro .title-left {
  text-align: left;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;

  h1 {
    margin-bottom: 1rem;
    font-size: 2rem;
  }
}

.intro .title-right {
  text-align: right;

  p {
    font-size: .8rem;
    line-height: 1.4;
  }

  code {
    margin-top: .5rem;
    display: inline-block;
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
  text-decoration: none;
}

.intro a {
  text-decoration: none;
  color: #fff;
}
</style>