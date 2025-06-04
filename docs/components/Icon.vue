<script setup lang="ts">
import { computed } from 'vue'
import Shadcn from './icons/shadcn.vue'
import React from './icons/react.vue'
import Vue from './icons/vue.vue'
import Express from './icons/express.vue'
import Fastify from './icons/fastify.vue'
import Tanstack from './icons/tanstack.vue'
import Angular from './icons/angular.vue'
import Svelte from './icons/svelte.vue'
import Nextjs from './icons/nextjs.vue'
import Nuxt from './icons/nuxt.vue'
import Bun from './icons/bun-sqlite.vue'
import Solid from './icons/solid.vue'
import Json from './icons/json.vue'
import Postgres from './icons/postgres.vue'
import Mysql from './icons/mysql.vue'
import Mongodb from './icons/mongodb.vue'
import Sqlite from './icons/sqlite.vue'
import Mssql from './icons/mssql.vue'
import Mui from './icons/mui.vue'
import Vite from './icons/vite.vue'
import Live from './icons/live.vue'
import Stackblitz from './icons/stackblitz.vue'
import Codesandbox from './icons/codesandbox.vue'
import Github from './icons/github.vue'
import Hono from './icons/hono.vue'
import Hapi from './icons/hapi.vue'
import Koa from './icons/koa.vue'
import Nest from './icons/nest.vue'
import Duckdb from './icons/duckdb.vue'
import Oracle from './icons/oracle.vue'
import Sqljs from './icons/sqljs.vue'
import Turso from './icons/turso.vue'

const props = defineProps<{
  tech:
    | 'shadcn'
    | 'react'
    | 'vue'
    | 'express'
    | 'fastify'
    | 'tanstack'
    | 'angular'
    | 'svelte'
    | 'nextjs'
    | 'nuxt'
    | 'bun-sqlite'
    | 'solid'
    | 'json files'
    | 'postgres'
    | 'mysql'
    | 'mongodb'
    | 'sqlite'
    | 'mssql'
    | 'mui'
    | 'vite'
    | 'live'
    | 'stackblitz'
    | 'codesandbox'
    | 'github'
    | 'hono'
    | 'hapi'
    | 'koa'
    | 'nest'
    | 'duckdb'
    | 'oracle'
    | 'sqljs'
    | 'turso'
  link?: string | boolean
  sizeIco?: number
  isShiny?: boolean
  newTab?: boolean // New prop to control target behavior
  techName?: string
}>()
const getIcon = (tech: string) => {
  switch (tech) {
    case 'shadcn':
      return Shadcn
    case 'react':
      return React
    case 'vue':
      return Vue
    case 'express':
      return Express
    case 'fastify':
      return Fastify
    case 'tanstack':
      return Tanstack
    case 'angular':
      return Angular
    case 'svelte':
      return Svelte
    case 'nextjs':
      return Nextjs
    case 'nuxt':
      return Nuxt
    case 'bun-sqlite':
      return Bun
    case 'solid':
      return Solid
    case 'json files':
      return Json
    case 'postgres':
      return Postgres
    case 'mysql':
      return Mysql
    case 'mongodb':
      return Mongodb
    case 'sqlite':
      return Sqlite
    case 'mssql':
      return Mssql
    case 'mui':
      return Mui
    case 'vite':
      return Vite
    case 'live':
      return Live
    case 'stackblitz':
      return Stackblitz
    case 'codesandbox':
      return Codesandbox
    case 'github':
      return Github
    case 'hono':
      return Hono
    case 'hapi':
      return Hapi
    case 'koa':
      return Koa
    case 'nest':
      return Nest
    case 'duckdb':
      return Duckdb
    case 'oracle':
      return Oracle
    case 'sqljs':
      return Sqljs
    case 'turso':
      return Turso
    // Add cases for other technologies here
    default:
      return null
  }
}

const Icon = computed(() => getIcon(props.tech))

const isLink = computed(() => typeof props.link === 'string')

const linkTarget = computed(() => (props.newTab ? '_blank' : undefined))
const linkRel = computed(() =>
  props.newTab ? 'noopener noreferrer' : undefined,
)
</script>

<template>
  <div class="tech">
    <a v-if="isLink" :href="link" :target="linkTarget" :rel="linkRel">
      <component
        :is="Icon"
        :class="{ 'shiny-button': isShiny }"
        :sizeIco="sizeIco"
      />
      <span>{{ techName || tech }}</span>
    </a>
    <template v-else>
      <component
        :is="Icon"
        :class="{ 'shiny-button': isShiny }"
        :sizeIco="sizeIco"
      />
      <span>{{ tech }}</span>
    </template>
  </div>
</template>

<style scoped>
.tech {
  display: grid;
  justify-items: center;
  transition: transform 0.2s ease-in-out;
}

.tech span {
  font-size: small;
  color: gray;
}

.tech:hover {
  transform: scale(1.2);
}

.tech a {
  display: grid;
  justify-items: center;
  text-decoration: none;
  color: inherit;
}

.shiny-button {
  transition: transform 0.2s ease-in-out;
  color: black;
  border: none;
  font-size: 16px;
  cursor: pointer;
  border-radius: 8px;
  transition: box-shadow 0.3s ease-in-out;
  position: relative;
  overflow: hidden;
}

.dark .shiny-button {
  color: white;
}

.shiny-button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: -50%;
  width: 200%;
  height: 200%;
  transform: translateY(-50%) rotate(45deg);
  transition: left 0.5s ease-in-out;
}

.shiny-button:hover::before {
  left: 150%;
}

.shiny-button:hover {
  box-shadow:
    0 0 20px rgba(0, 123, 255, 0.7),
    0 0 40px rgba(0, 123, 255, 0.4);
  transform: scale(1.2);
}
</style>
