<script setup lang="ts">
import Editor from './Editor.vue'
import Icon from '../Icon.vue'
</script>

<template>
  <div class="intro">
    <div class="title">
      <div class="title-left">
        <h1>
          Adding full to your <i><small>full-</small></i
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
    <div class="intro-logos-claim">
      Works with your favorite stack
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
  gap: .5rem;
  margin-top: 1rem;
  margin-bottom: .5rem;

  svg, img {
    width: auto;
    height: 24px;
  }

  span {
    display: none;
  }
}

.intro-logos-claim {
  font-size: .8rem;
  color: #8262E1;
  margin-bottom: 2rem;
}
</style>
