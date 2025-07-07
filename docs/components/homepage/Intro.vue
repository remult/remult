<script setup lang="ts">
import Editor from './Editor.vue'
import EditorMobile from './EditorMobile.vue'
import Icon from '../Icon.vue'
import { ref, onMounted, onUnmounted } from 'vue'

const features = [
  { text: 'full', bgColor: '#51319E', textColor: '#BDA1FF' },
  { text: 'Auto API', bgColor: '#FF31D9', textColor: '#7D1369' },
  { text: 'Validation', bgColor: '#327C98', textColor: '#9ED9F0' },
  { text: 'ORM', bgColor: '#51319E', textColor: '#BDA1FF' },
  { text: 'Authorization', bgColor: '#0D5337', textColor: '#2CA171' },
  { text: 'Lifecycle hooks', bgColor: '#050643', textColor: '#7173F2' },
  { text: 'Real Time', bgColor: '#538CC9', textColor: '#184472' },
  { text: 'Typesafety', bgColor: '#8262E1', textColor: '#ded6f6' },
  { text: 'Offline Support', bgColor: '#A91D23', textColor: '#FF979B' },
  { text: 'Admin UI', bgColor: '#00D8FF', textColor: '#266F7C' },
]

const currentFeature = ref(features[0])
const isShaking = ref(false)
const windowWidth = ref(0)

let interval: number | null = null
let handleResize: (() => void) | null = null

const shake = () => {
  isShaking.value = true
  setTimeout(() => {
    isShaking.value = false
  }, 500)
}

onMounted(() => {
  // Set initial window width
  windowWidth.value = window.innerWidth

  // Add resize listener
  handleResize = () => {
    windowWidth.value = window.innerWidth
  }
  window.addEventListener('resize', handleResize)

  let index = 0
  const normalDuration = 2000
  const longItemDuration = 3000

  const updateText = () => {
    index = (index + 1) % features.length
    currentFeature.value = features[index]
    shake()

    // If we're at the last item, wait longer
    const duration = index === 0 ? longItemDuration : normalDuration
    interval = window.setTimeout(updateText, duration)
  }

  interval = window.setTimeout(updateText, normalDuration)

  // Setup Intersection Observer for fade-in animations
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in-visible')
          observer.unobserve(entry.target)
        }
      })
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    },
  )

  // Observe all fade-in elements with sequential loading
  const fadeInElements = document.querySelectorAll('.fade-in')
  fadeInElements.forEach((el, index) => {
    // Add a delay of 50ms * index to create sequential animation
    setTimeout(() => {
      observer.observe(el)
    }, index * 120)
  })
})

onUnmounted(() => {
  if (handleResize) {
    window.removeEventListener('resize', handleResize)
  }
  if (interval) {
    clearTimeout(interval)
  }
})
</script>

<template>
  <div class="intro">
    <div class="intro-background fade-in"></div>
    <div class="title">
      <div class="title-left">
        <h1 class="fade-in">
          Adding
          <span
            :class="[
              'rotating-text',
              currentFeature.text.toLowerCase(),
              { shake: isShaking },
            ]"
            :style="{
              '--bg-color': currentFeature.bgColor,
              '--text-color': currentFeature.textColor,
            }"
            >{{ currentFeature.text }}</span
          >
          <span> to your full-stack</span>
        </h1>

        <div class="cta fade-in">
          <a href="https://learn.remult.dev/">Try in Browser -></a>
          <a href="/docs">Documentation -></a>
        </div>
      </div>

      <div class="title-right fade-in">
        <p>
          Want to see remult in action in 60 sec?<br />
          Auth, DB, CRUD – using your stack.<br />
          <code class="code-init">npm init remult@latest</code>
        </p>
      </div>
    </div>

    <div class="editor-container fade-in">
      <ClientOnly>
        <Editor v-if="windowWidth >= 1024" />
        <EditorMobile v-else />
      </ClientOnly>
    </div>
  </div>

  <div class="intro-stack fade-in">
    <div class="intro-logos">
      <Icon tech="react" link="/docs/installation/framework/react" />
      <Icon tech="angular" link="/docs/installation/framework/angular" />
      <Icon tech="vue" link="/docs/installation/framework/vue" />
      <Icon tech="svelte" link="/docs/installation/framework/sveltekit" />
      <Icon tech="nextjs" link="/docs/installation/framework/nextjs" />
      <Icon tech="solid" link="/docs/installation/framework/solid" />
      <Icon tech="nuxt" link="/docs/installation/framework/nuxt" />
      <Icon tech="express" link="/docs/installation/server/express" />
      <Icon tech="fastify" link="/docs/installation/server/fastify" />
      <Icon tech="hono" link="/docs/installation/server/hono" />
      <Icon tech="elysia" link="/docs/installation/server/elysia" />
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
      <Icon tech="d1" link="/docs/installation/database/d1" />
      <Icon tech="json files" link="/docs/installation/database/json" />
    </div>
    <div class="intro-logos-claim">Works with your favorite stack</div>
  </div>
</template>

<style>
.intro {
  position: relative;
  padding: 0 2rem 0 2rem;
  width: 100%;
  max-width: 1150px;
  margin: 8rem auto 3rem auto;
  border-radius: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.intro-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(
    circle farthest-corner at 50% -50%,
    #05052f00 60%,
    #0c0f75 85%,
    #7042b5 92%
  );
  border-radius: 1.5rem;
  z-index: -1;
}

.intro-background::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(
    circle farthest-corner at 50% -50%,
    #05052f00 60%,
    #0c0f75 70%,
    #7042b5 100%
  );
  border-radius: 1.5rem;
  opacity: 0;
  animation: pulse-opacity 10s ease-in-out infinite;
}

@keyframes pulse-opacity {
  0%,
  100% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
}

.intro .editor-container {
  margin-bottom: -32px;
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
    font-weight: 500;
    color: var(--vp-c-text);
    margin-bottom: 1rem;
    font-size: 2rem;
  }
}

.intro .title-right {
  text-align: right;

  p {
    color: var(--vp-c-text);
    opacity: 0.8;
    font-size: 0.8rem;
    line-height: 1.4;
  }

  code {
    color: var(--vp-c-text);
    margin-top: 0.5rem;
    display: inline-block;
  }

  .code-init {
    user-select: all;
  }
}

.intro-stack {
  padding: 0 1rem;
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

.intro .editor-body {
  position: relative;

  &:before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 300px;
    height: 300px;
    background: radial-gradient(
      circle at bottom left,
      rgb(62 47 152 / 55%),
      rgba(5, 6, 67, 0) 71%
    );
    pointer-events: none;
    z-index: 1;
  }

  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    right: 0;
    width: 300px;
    height: 300px;
    background: radial-gradient(
      circle at bottom right,
      rgb(22 26 141 / 46%),
      rgba(5, 6, 67, 0) 71%
    );
    pointer-events: none;
    z-index: 1;
  }
}

@media screen and (max-width: 1024px) {
  .intro {
    margin-top: 3rem;
  }

  .intro-logos {
    margin-top: 2rem;
    max-width: 470px;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .intro .editor-container {
    width: 600px;
  }
}

@media screen and (max-width: 600px) {
  .intro {
    padding: 0 1rem 0 1rem;
  }

  .intro .editor-container {
    width: 100%;
  }
}

.intro-logos-claim {
  font-size: 0.8rem;
  color: var(--vp-c-text);
  opacity: 0.5;
  margin-bottom: 2rem;
}

.rotating-text {
  display: inline-block;
  min-width: 40px;
  text-align: center;
  padding: 0 8px;
  background-color: var(--text-color);
  color: var(--bg-color);
  transition: background-color 0.3s ease;
}

body.dark .rotating-text {
  background-color: var(--bg-color);
  color: var(--text-color);
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
  animation: shake 1s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

@media (prefers-reduced-motion: reduce) {
  .shake {
    animation: none;
  }

  .fade-in {
    transition: none;
  }

  .fade-in-visible {
    opacity: 1;
    transform: none;
  }
}

.cta {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.cta a {
  position: relative;
  color: #fff;
  padding: 0.5rem 1rem;
  text-decoration: none;
  border-radius: 4px;
  z-index: 1;
  transition: color 0.3s ease;
  background: radial-gradient(
    circle farthest-corner at 8% -50%,
    #d6d6d600 -40%,
    #2e34a2 28%,
    #7141b5 200%
  );
}

.cta a:nth-child(2) {
  background: #f6f6f7;
  color: #545459;
  transition: all 0.3s ease;
}

.cta a:nth-child(2)::before {
  display: none;
}

.cta a:nth-child(2):hover {
  background: #e5e5e7;
  color: #545459;
}

.cta a::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  border-radius: 4px;
  z-index: -1;
  transition: opacity 0.3s ease-in-out;
  opacity: 0;
  background: radial-gradient(
    circle farthest-corner at 8% -50%,
    #d6d6d600 -10%,
    #2e34a2 35%,
    #7141b5 79%
  );
}

.cta a:hover::before {
  opacity: 1;
}

.cta a:hover {
  color: #fff;
}

.dark .cta a {
  position: relative;
  background: radial-gradient(
    circle farthest-corner at 50% -50%,
    #17178e00 -3%,
    #0c0f75 77%,
    #7042b5 110%
  );
  z-index: 1;
}

.dark .cta a:hover {
  color: #fff;
}

.dark .cta a::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: radial-gradient(
    circle farthest-corner at 50% -50%,
    #05052f00 -10%,
    #0c0f75 35%,
    #7042b5 100%
  );
  z-index: -1;
  transition: opacity 0.3s ease;
  opacity: 0;
}

.dark .cta a:hover::before {
  opacity: 1;
}

.dark .cta a:nth-child(2) {
  background: #050739;
  color: #fff;
}

.dark .cta a:nth-child(2)::before {
  display: none;
}

.dark .cta a:nth-child(2):hover {
  background: #0c0f75;
  color: #fff;
}

.intro a {
  text-decoration: none;
  color: #fff;
}

@media screen and (max-width: 1024px) {
  .intro .title {
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .intro .title-left {
    text-align: center;
    justify-content: center;
    align-items: center;

    h1 {
      font-size: 1.5rem;
      line-height: 1.2;
    }
  }

  .intro .title-right {
    text-align: center;
  }

  .intro .cta {
    align-items: center;
    justify-content: center;

    a {
      font-size: 0.8rem;
      padding: 0.5rem 0.75rem;
    }
  }
}

@media screen and (max-width: 480px) {
  .intro .title-left h1 span:last-child {
    display: block;
  }

  .intro {
    margin-left: 0rem;
    margin-right: 0rem;
  }

  .intro .title {
    margin-bottom: 1rem;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  opacity: 0;
  transition:
    opacity 0.6s ease-out,
    transform 0.6s ease-out;
}

.fade-in-visible {
  opacity: 1;
  transform: translateY(0);
}
</style>
