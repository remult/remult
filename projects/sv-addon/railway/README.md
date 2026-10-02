# Railway

Everything about the [Railway template](https://github.com/jycouet/remult-sveltekit-template-railway)
lives here. The template repo is **generated** - never hand-edit it.

| File | What |
| --- | --- |
| `make-template.sh` | builds the app (this add-on + `sv-addon-railway`), checks it, optionally pushes |
| `config.mjs` | post-processing: `.railway/railway.ts`, `start` script, template README |
| `overview.md` | the listing overview, in Railway's required scaffold - paste as is |

## Regenerate

```sh
npm run railway:template          # build into tmp/railway-template
PUSH=1 npm run railway:template   # ... and force-push to the template repo
```

Overrides: `TEMPLATE_URL` (deploy button), `REPO`, `APP_NAME`, `OUT`.

## Listing form

- **Description** (64 chars): `SvelteKit + Remult: type-safe CRUD, auth, live queries, admin UI`
- **Category**: Web
- **Overview**: `overview.md`

## Composer settings

A template deploy never runs `.railway/railway.ts`, so mirror it in the composer:

- source `jycouet/remult-sveltekit-template-railway`, root `/`
- a `Postgres` service
- app service: start `node scripts/prod-server.js`, healthcheck `/`, app sleeping on,
  **HTTP proxy on port 3000** (without it: "Unexposed service")
- variables: `DATABASE_URL=${{Postgres.DATABASE_URL}}` · `ORIGIN=https://${{RAILWAY_PUBLIC_DOMAIN}}`
  · `AUTH_SECRET=${{secret(32)}}` · `PORT=3000`

No admin variable to set: the first account to sign in owns the app.
