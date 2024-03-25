import type { Migrations } from 'remult/migrations'
export const migrations: Migrations = {
  0: async ({ sql }) => {
    await sql(`--sql
CREATE SCHEMA IF NOT EXISTS public;
CREATE table "tasks" (
  "id" varchar default '' not null primary key,
  "title" varchar default '' not null,
  "completed" boolean default false not null,
  "createdAt" timestamptz
)`)
  },
}
