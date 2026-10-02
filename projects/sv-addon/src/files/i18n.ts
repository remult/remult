import type { Ctx } from '../ctx.ts'

/** Message ids used by the generated UI, per locale. */
export const MESSAGES: Record<string, Record<string, string>> = {
  en: {
    landing_cta: 'Open the app',
    landing_docs: 'Read the docs',
    landing_point_entities: 'One class per table. The REST API, the types and the admin UI follow.',
    landing_point_live: 'Live queries over SSE: every tab stays in sync, for free.',
    landing_point_rules: 'Permissions live on the entity, so the server always has the last word.',
    nav_tasks: 'Tasks',
    nav_internal: 'Internal',
    nav_admin: 'Admin UI',
    login_title: 'Sign in',
    login_cta: 'Sign in',
    sign_out: 'Sign out',
    login_as: 'Login as',
    back_to_real_user: 'Back to {name}',
    impersonating: 'You are seeing the app as {name}',
    switch_back: 'switch back',
  },
  fr: {
    landing_cta: "Ouvrir l'app",
    landing_docs: 'Lire la doc',
    landing_point_entities: "Une classe par table. L'API REST, les types et l'admin suivent.",
    landing_point_live: 'Requêtes live en SSE : tous les onglets restent synchronisés.',
    landing_point_rules: "Les permissions vivent sur l'entité : le serveur a toujours le dernier mot.",
    nav_tasks: 'Tâches',
    nav_internal: 'Interne',
    nav_admin: 'Admin UI',
    login_title: 'Connexion',
    login_cta: 'Se connecter',
    sign_out: 'Se déconnecter',
    login_as: 'Se connecter en tant que',
    back_to_real_user: 'Revenir à {name}',
    impersonating: "Vous voyez l'app en tant que {name}",
    switch_back: 'revenir',
  },
}

export const LOCALES = Object.keys(MESSAGES)

export const localeSwitchFile = (ctx: Ctx) => `<script lang="ts">
  import { getLocale, locales, setLocale } from '${ctx.lib}/paraglide/runtime.js'
</script>

<div class="flex h-8 items-center gap-0.5 rounded-lg border border-border px-0.5 text-xs">
  {#each locales as locale (locale)}
    <button
      class="h-6 cursor-pointer rounded-md px-1.5 uppercase transition"
      class:bg-accent={getLocale() === locale}
      class:text-accent-foreground={getLocale() === locale}
      class:text-muted-foreground={getLocale() !== locale}
      onclick={() => setLocale(locale)}
    >
      {locale}
    </button>
  {/each}
</div>
`
