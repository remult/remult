import type { MigrationSteps } from 'remult/migrations'
export const migrations: MigrationSteps = {
  0: (sql) =>
    sql(`--sql
drop table if exists "tasks"`),
  1: (sql) =>
    sql(`--sql
CREATE SCHEMA IF NOT EXISTS public;
CREATE table "tasks" (
  "id" varchar default '' not null primary key,
  "title" varchar default '' not null
)`),

  3: (sql) =>
    sql(`--sql
alter table "tasks" add column "completed" boolean not null default '0'`),
}
