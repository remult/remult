# Deploy and Host Remult & SvelteKit on Railway

Remult & SvelteKit makes your data model the app. Write one entity class and you get a typed REST API, validation on both sides, live queries that keep every tab in sync, and an admin UI - with auth, i18n and a landing page already standing. No API layer to write, no client SDK to regenerate. Ship features, not plumbing.

## About Hosting Remult & SvelteKit

It deploys like any Node app, with one twist worth knowing: the schema builds itself on boot from your entity classes, so there is no migration step in the pipeline and no database access at build time. Railway attaches Postgres and the app picks it up. A single long-lived process holds the live-query stream open, which is why the bundled server compresses everything except that one endpoint. Set a session secret, deploy, and sign in with your email - the first account created owns the app, so there is no seed data to clean up and no admin flag to flip.

## Common Use Cases

- Internal tools and back-offices, without hand-rolling CRUD and roles again
- SaaS MVPs that need auth, a landing page and a private app on day one
- Live dashboards where every open tab must follow the database in real time
- AI-assisted builds: one entity file is the whole contract an agent has to touch

## Dependencies for Remult & SvelteKit Hosting

- Node.js 20+ (Railway's builder)
- PostgreSQL (attached by this template)

### Implementation Details

This is the entire "backend" for a feature:

```ts
@Entity('tasks', { allowApiRead: true, allowApiDelete: Roles.admin })
export class Task {
  @Fields.id() id!: string
  @Fields.string<Task>({ validate: (t) => t.title.length > 2 || 'Too short' }) title = ''
  @Fields.boolean() completed = false
}
```

That class is the table, the REST endpoints, the TypeScript types, the validation on both sides, and a screen in the admin UI. Add a field, refresh, it is everywhere.

Also in the box: admin UI at `/api/admin` · passwordless sign-in where the first account is the admin · **login-as** with a way back · public landing + private `/app` · backstage with users, cron runs, mails and a read-only SQL console · Tailwind v4 theming in 3 CSS variables, light/dark with no flash · Paraglide i18n (`en` + `fr`) · OG tags and favicon from one file · vitest, ESLint, Prettier · `AGENTS.md` and agent skills pulled straight from the library repos.

## Why Deploy Remult & SvelteKit on Railway?

Railway is a singular platform to deploy your infrastructure stack. Railway will host your infrastructure so you don't have to deal with configuration, while allowing you to vertically and horizontally scale it.

By deploying Remult & SvelteKit on Railway, you are one step closer to supporting a complete full-stack application with minimal burden. Host your servers, databases, AI agents, and more on Railway.
