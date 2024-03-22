import type { MigrationSteps } from "remult/migrations";
export const migrations: MigrationSteps = {
  0: (sql) =>
    sql(`--sql
CREATE SCHEMA IF NOT EXISTS public;
CREATE table "tasks" (
  "id" varchar default '' not null primary key,
  "title" varchar default '' not null
)`),
  1: (sql) =>
    sql(`--sql
ALTER table "tasks" ADD column "id" varchar default '' not null`),
  2: (sql) =>
    sql(`--sql
ALTER table "tasks" ADD column "title" varchar default '' not null`),
  3: (sql) =>
    sql(`--sql
CREATE SCHEMA IF NOT EXISTS public;
CREATE table "tasks" (
  "id" varchar default '' not null primary key,
  "title" varchar default '' not null
)`),
  4: (sql) =>
    sql(`--sql
CREATE SCHEMA IF NOT EXISTS public;
CREATE table "tasks" (
  "id" varchar default '' not null primary key,
  "title" varchar default '' not null
)`),
  5: (sql) =>
    sql(`--sql
create table "tasks" ("id" varchar(255) not null default '', "title" varchar(255) not null default '', constraint "tasks_pkey" primary key ("id"))`),
  6: (sql) =>
    sql(`--sql
alter table "tasks" add column "id" varchar(255) not null default ''`),
  7: (sql) =>
    sql(`--sql
    alter table "tasks" add column "title" varchar(255) not null default ''`),
  8: (sql) =>
    sql(`--sql
create table "tasks" ("id" varchar(255) not null default '', "title" varchar(255) not null default '', constraint "tasks_pkey" primary key ("id"))`),
  9: (sql) =>
    sql(`--sql
alter table "tasks" add column "id" varchar(255) not null default ''`),
  10: (sql) =>
    sql(`--sql
alter table "tasks" add column "title" varchar(255) not null default ''`),
  11: (sql) =>
    sql(`--sql
create table "tasks" ("id" varchar(255) not null default '', "title" varchar(255) not null default '', constraint "tasks_pkey" primary key ("id"))`),
  12: (sql) =>
    sql(`--sql
alter table "tasks" add column "id" varchar(255) not null default ''`),
  13: (sql) =>
    sql(`--sql
alter table "tasks" add column "title" varchar(255) not null default ''`),
};
