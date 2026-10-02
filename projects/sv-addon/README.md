# `@remult/sv`

A [`sv`](https://svelte.dev/docs/cli/overview) community add-on: a full-stack, type-safe SvelteKit
app built on [remult](https://remult.dev) - in one command.

```sh
npx sv create my-app --add @remult
# or, in an existing SvelteKit project
npx sv add @remult
```

> Requires SvelteKit + TypeScript. Built for `sv@next` / SvelteKit 3.
> Needs `firstly@0.10.1` (kit 3 peer range + `firstly/cron` export).

## Two ways in

The first question decides how much you get asked:

- **🤯 Blow my mind** - the whole opinionated stack, no other question.
- **🎛️ Let me pick** - choose firstly and the features one by one.

It pulls `tailwindcss` and `paraglide` along the way (official add-ons).

## What lands in your project

| | |
| --- | --- |
| **Shape** | public landing at `/`, private app under `/app`, backstage under `/app/internal` |
| **API** | `remultApi` mounted at `/api`, entities in `src/lib/entities` |
| **Database** | JSON files out of the box; set `DATABASE_URL` and the same code runs on postgres |
| **CRUD demo** | live list over SSE, entity-level validation, optimistic writes |
| **Auth + login-as** | signed cookie session, seeded users, impersonation **with a way back** |
| **Admin UI** | remult's generated data browser at `/api/admin` |
| **Backstage** | users, cron runs, mails, a read-only SQL console, docs & star links |
| **Onboarding panel** | an always-visible checklist, **live checked against real data** |
| **i18n** | paraglide with `en` + `fr` already translated, switcher in the header |
| **Identity** | `src/lib/site.ts` drives `<title>`, OG tags, favicon and a generated `og.svg` |
| **Design** | Tailwind v4 semantic tokens, light/dark with no flash of the wrong theme |
| **Production** | adapter-node + polka gzip, with remult's SSE endpoint left uncompressed |
| **AI skills** | `AGENTS.md` + `.claude/skills/{remult,firstly}/SKILL.md` |

The onboarding panel is the tour: every step is verified for real (task count, `remult.user`,
even "you added a field to `Task`" - read off the entity metadata), so it can never lie to you.

## Develop the add-on

```sh
npm install
npm run demo-create     # scratch SvelteKit app in ./demo
npm run demo-add:full   # build + apply the add-on with the "blow my mind" preset
cd demo && npm install && npm run dev
```

`npm run demo-add` applies it interactively instead. `npm test` generates real kit projects and
asserts on the result.
