import type { Migrations } from 'remult/migrations'
export const migrations: Migrations = {
  0: () => {},
  1: async ({ sql }) => {
    await sql(`--sql
create table "tasks" ("id" varchar(255) not null default '', "title" varchar(255) not null default '', "completed" boolean not null default '0', "createdAt" timestamptz, constraint "tasks_pkey" primary key ("id"))`)
  },
  2: async ({ sql }) => {
    await sql(`--sql
alter table "tasks" add column "createdAt" timestamptz`)
    // remove column tasks.createdAt1
  },
  3: async ({ sql }) => {
    await sql(`--sql
create table "tasks" ("id" varchar(255) not null default '', "title" varchar(255) not null default '', "completed" boolean not null default '0', "createdAt" timestamptz, constraint "tasks_pkey" primary key ("id"))`)
    // remove table tasks1
  },
  4: async ({ sql }) => {
    await sql(`--sql
alter table "tasks" add column "createdAt" timestamptz`)
    // TODO: implement remove column tasks.createdAt1
  },
}
