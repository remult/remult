import type { Migrations } from 'remult/migrations'
export const migrations: Migrations = {
  0: async ({ sql }) => {
    await sql(`--sql
CREATE SCHEMA IF NOT EXISTS public;
CREATE table "tasks" (
  "id" varchar default '' not null primary key,
  "title" varchar default '' not null
)`)
  },
  1: async ({ sql }) => {
    await sql(`--sql
ALTER table "tasks" ADD column "completed" boolean default false not null`)
    await sql(`--sql
ALTER table "tasks" ADD column "createdAt" timestamp`)
  },
  2: async ({ sql }) => {
    await sql(`--sql
ALTER table "tasks" ADD column "id" varchar default '' not null`)
    await sql(`--sql
ALTER table "tasks" ADD column "title" varchar default '' not null`)
    await sql(`--sql
ALTER table "tasks" ADD column "completed" boolean default false not null`)
    await sql(`--sql
ALTER table "tasks" ADD column "createdAt" timestamptz`)
  },
  3: async ({ sql }) => {
    await sql(`--sql
ALTER table "tasks" ADD column "id" varchar default '' not null`)
    await sql(`--sql
ALTER table "tasks" ADD column "title" varchar default '' not null`)
    await sql(`--sql
ALTER table "tasks" ADD column "completed" boolean default false not null`)
    await sql(`--sql
ALTER table "tasks" ADD column "createdAt" timestamptz`)
  },
  4: async ({ sql }) => {
    await sql(`--sql
ALTER table "tasks" ADD column "id" varchar default '' not null`)
    await sql(`--sql
ALTER table "tasks" ADD column "title" varchar default '' not null`)
    await sql(`--sql
ALTER table "tasks" ADD column "completed" boolean default false not null`)
    await sql(`--sql
ALTER table "tasks" ADD column "createdAt" timestamptz`)
  },
  5: async ({ sql }) => {
    await sql(`--sql
ALTER table "tasks" ADD column "id" varchar default '' not null`)
    await sql(`--sql
ALTER table "tasks" ADD column "title" varchar default '' not null`)
    await sql(`--sql
ALTER table "tasks" ADD column "completed" boolean default false not null`)
    await sql(`--sql
ALTER table "tasks" ADD column "createdAt" timestamptz`)
  },
  6: async ({ sql }) => {
    await sql(`--sql
ALTER table "tasks" ADD column "id" varchar default '' not null`)
    await sql(`--sql
ALTER table "tasks" ADD column "title" varchar default '' not null`)
    await sql(`--sql
ALTER table "tasks" ADD column "completed" boolean default false not null`)
    await sql(`--sql
ALTER table "tasks" ADD column "createdAt" timestamptz`)
  },
}
