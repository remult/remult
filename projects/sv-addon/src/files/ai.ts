import type { Ctx } from '../ctx.ts'
import { lines } from '../lines.ts'

export function agentsSection(ctx: Ctx) {
  return lines(
    `## This app`,
    ``,
    `SvelteKit + [remult](https://remult.dev)${ctx.ff ? ' + [firstly](https://firstly.fun)' : ''}, TypeScript, Tailwind v4.`,
    `Entities are the contract: declare a field once and the REST API, the types, the admin UI`,
    `and the validation follow. There is no hand-written API layer - do not add one.`,
    ``,
    `| Where | What |`,
    `| --- | --- |`,
    `| \`src/modules/<feature>/\` | a feature: entity, server code, remote functions, UI |`,
    `| \`src/lib/server/api.ts\` | the whole backend: entities, modules, session |`,
    `| \`src/lib/server/db.ts\` | data provider: postgres when \`DATABASE_URL\` is set, JSON files otherwise |`,
    ctx.auth && `| \`src/modules/auth/\` | User entity, session, guard, login-as |`,
    `| \`src/lib/\` | what every feature shares: roles, site, ui primitives |`,
    `| \`src/routes/api/[...remult]/+server.ts\` | mounts the API |`,
    `| \`src/routes/+page.svelte\` | public landing; the app itself lives under \`/app\` |`,
    ctx.internal && `| \`src/routes/app/internal/*\` | backstage pages (users, crons, mails, SQL) |`,
    ``,
    `Rules of the house:`,
    ``,
    `- New feature = a folder in \`src/modules/\`, starting with its entity. Never write a fetch handler for CRUD.`,
    `- Server-only files end in \`.server.ts\` - SvelteKit then refuses to bundle them for the browser.`,
    `- Permissions live on the entity (\`allowApiRead\`, \`allowApiUpdate\`, \`apiPrefilter\`), never in the UI.`,
    `  The UI may hide a button; the server is what refuses.`,
    ctx.ff && `- Use \`FF_Entity\`, not \`@Entity\` (same signature, plus changelog).`,
    ctx.ff && `- In components read data with \`ff(E).many(...)\` / \`ff(E).one(...)\`; use \`repo(E)\` in handlers and on the server.`,
    !ctx.ff && `- In components use \`repo(E).liveQuery(...)\`; \`repo(E)\` everywhere else.`,
    `- Never import from \`$lib/server/*\` in client code - keep secrets server-side.`,
    ``,
    `The full patterns live in skills installed straight from the source repos`,
    `(\`npm run skills\` to install, \`npm run skills:update\` to refresh): ${ctx.ff ? '`remult/remult` and `jycouet/firstly`' : '`remult/remult`'}.`,
    `Don't hand-edit them and don't copy their content here - they move with the libraries.`,
    ``,
  )
}
