import type { Ctx } from '../ctx.ts'
import { lines } from '../lines.ts'

/** Bluesky's compose intent, prefilled - handles verified to resolve. */
function bragUrl() {
  const text = 'Just shipped a full-stack app with @remult.dev + @svelte.dev on @railway.com \u{1F680}'
  return `https://bsky.app/intent/compose?text=${encodeURIComponent(text)}`
}

export function taskFieldCount(ctx: Ctx) {
  return ctx.auth ? 6 : 5
}

export function onboardingStateFile(ctx: Ctx) {
  return lines(
    `// Delete me? Remove this file, Onboarding.svelte, and the <Onboarding /> line in AppShell.svelte.`,
    `import { browser } from '${ctx.appEnv}'`,
    `import { remult, repo } from 'remult'`,
    ``,
    `import { Task } from '${ctx.mod}/task/Task.ts'`,
    ``,
    `export type Step = {`,
    `  id: string`,
    `  title: string`,
    `  hint: string`,
    `  href?: string`,
    `  external?: boolean`,
    `  /** Live truth. No check = a step you tick yourself. */`,
    `  check?: () => boolean | Promise<boolean>`,
    `}`,
    ``,
    `/** Fields on Task when this project was generated. */`,
    `const TASK_FIELDS_AT_BIRTH = ${taskFieldCount(ctx)}`,
    ``,
    `const flagKey = (id: string) => \`onboarding:\${id}\``,
    `export const readFlag = (id: string) => browser && localStorage.getItem(flagKey(id)) === '1'`,
    `export const setFlag = (id: string, on = true) => {`,
    `  if (!browser) return`,
    `  if (on) localStorage.setItem(flagKey(id), '1')`,
    `  else localStorage.removeItem(flagKey(id))`,
    `}`,
    ``,
    `export const steps: Step[] = [`,
    ctx.crud && `  {`,
    ctx.crud && `    id: 'create',`,
    ctx.crud && `    title: 'Create a task',`,
    ctx.crud && `    hint: 'Typed end to end. Validation lives on the entity and runs on both sides.',`,
    ctx.crud && `    href: '/app',`,
    ctx.crud && `    check: async () => (await repo(Task).count()) > 2,`,
    ctx.crud && `  },`,
    `  {`,
    `    id: 'field',`,
    `    title: 'Add a field to Task',`,
    `    hint: 'src/modules/task/Task.ts - one line, and the API, the types and the admin follow.',`,
    `    check: () => repo(Task).metadata.fields.toArray().length > TASK_FIELDS_AT_BIRTH,`,
    `  },`,
    ctx.auth && `  {`,
    ctx.auth && `    id: 'login',`,
    ctx.auth && `    title: 'Sign in - the first account is the admin',`,
    ctx.auth && `    hint: 'Your email is the account. Add a member in the backstage, then try login-as.',`,
    ctx.auth && `    href: '/login',`,
    ctx.auth && `    check: () => remult.authenticated(),`,
    ctx.auth && `  },`,
    ctx.admin && `  {`,
    ctx.admin && `    id: 'admin',`,
    ctx.admin && `    title: 'Open the Admin UI',`,
    ctx.admin && `    hint: 'A data browser generated from your entities, at /api/admin.',`,
    ctx.admin && `    href: '/api/admin',`,
    ctx.admin && `    external: true,`,
    ctx.admin && `    check: () => readFlag('admin'),`,
    ctx.admin && `  },`,
    ctx.internal && `  {`,
    ctx.internal && `    id: 'internal',`,
    ctx.internal && `    title: 'Visit the backstage',`,
    ctx.internal && `    hint: 'Users, cron runs, mails, SQL console - all yours to edit.',`,
    ctx.internal && `    href: '/app/internal',`,
    ctx.internal && `    check: () => readFlag('internal'),`,
    ctx.internal && `  },`,
    ctx.ai && `  {`,
    ctx.ai && `    id: 'ai',`,
    ctx.ai && `    title: 'Put your AI agent to work',`,
    ctx.ai && `    hint: 'AGENTS.md + skills are in the repo. Try: "add a Project entity with tasks".',`,
    ctx.ai && `  },`,
    `  {`,
    `    id: 'tests',`,
    `    title: 'Run the tests',`,
    `    hint: 'npm run test:unit - entity rules and the session signature, no server needed.',`,
    `  },`,
    `  {`,
    `    id: 'brag',`,
    `    title: 'Tell the world',`,
    `    hint: 'You are done. Post it, tag the people whose work you just deployed.',`,
    `    href: '${bragUrl()}',`,
    `    external: true,`,
    `    check: () => readFlag('brag'),`,
    `  },`,
    `]`,
    ``,
    `class Onboarding {`,
    `  done = $state<Record<string, boolean>>({})`,
    `  open = $state(true)`,
    `  dismissed = $state(false)`,
    ``,
    `  total = steps.length`,
    `  get completed() {`,
    `    return steps.filter((s) => this.done[s.id]).length`,
    `  }`,
    ``,
    `  async refresh() {`,
    `    for (const step of steps) {`,
    `      // A manual step is owned by localStorage; a checked step is owned by the data.`,
    `      this.done[step.id] = step.check ? Boolean(await step.check()) : readFlag(step.id)`,
    `    }`,
    `  }`,
    ``,
    `  tick(id: string, on: boolean) {`,
    `    setFlag(id, on)`,
    `    this.done[id] = on`,
    `  }`,
    ``,
    `  /** Shrinks to a dot - never gone, so it can always come back. */`,
    `  setDismissed(on: boolean) {`,
    `    this.dismissed = on`,
    `    setFlag('dismissed', on)`,
    `  }`,
    `}`,
    ``,
    `export const onboarding = new Onboarding()`,
    ``,
  )
}

export const onboardingComponentFile = `<!--
  The getting-started panel. To drop it for good: delete this file and
  onboarding.svelte.ts, then remove <Onboarding /> from AppShell.svelte.
-->
<script lang="ts">
  import { page } from '$app/state'

  import { onboarding, readFlag, setFlag, steps } from './onboarding.svelte.ts'

  let mounted = $state(false)

  $effect(() => {
    mounted = true
    onboarding.dismissed = readFlag('dismissed')
    // Gone for good? Delete this file, onboarding.svelte.ts, and <Onboarding /> in AppShell.svelte.
    onboarding.open = localStorage.getItem('onboarding:open') !== '0'
  })

  // Re-check on every navigation, and keep checking while the panel is open.
  $effect(() => {
    if (page.url.pathname.startsWith('/app/internal')) setFlag('internal')
    void onboarding.refresh()
  })

  $effect(() => {
    if (!onboarding.open || onboarding.dismissed) return
    const id = setInterval(() => void onboarding.refresh(), 2000)
    return () => clearInterval(id)
  })

  const toggle = () => {
    onboarding.open = !onboarding.open
    localStorage.setItem('onboarding:open', onboarding.open ? '1' : '0')
  }

  let pct = $derived(Math.round((onboarding.completed / onboarding.total) * 100))
</script>

{#snippet ring(size: string)}
  <svg viewBox="0 0 36 36" class="{size} -rotate-90">
    <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" stroke-width="3" class="text-muted" />
    <circle
      cx="18"
      cy="18"
      r="15"
      fill="none"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
      class="text-primary transition-[stroke-dasharray] duration-500"
      stroke-dasharray="{(pct / 100) * 94.2} 94.2"
    />
  </svg>
{/snippet}

{#if mounted && onboarding.dismissed}
  <button
    class="card-app fixed right-4 bottom-4 z-40 grid size-11 cursor-pointer place-items-center shadow-lg transition hover:scale-105"
    title="Getting started ({onboarding.completed}/{onboarding.total})"
    onclick={() => onboarding.setDismissed(false)}
  >
    {@render ring('size-9')}
    <span class="absolute text-[10px] font-semibold tabular-nums">{pct}%</span>
  </button>
{/if}

{#if mounted && !onboarding.dismissed}
  <div class="fixed right-4 bottom-4 z-40 w-[min(21rem,calc(100vw-2rem))]">
    <div class="card-app overflow-hidden shadow-lg">
      <div class="flex items-center gap-3 px-4 py-3">
        <button class="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left" onclick={toggle}>
          <span class="relative grid size-9 shrink-0 place-items-center">
            {@render ring('size-9')}
            <span class="absolute text-[10px] font-semibold tabular-nums">{pct}%</span>
          </span>
          <span class="min-w-0 flex-1">
            <span class="block text-sm font-semibold">Getting started</span>
            <span class="block text-xs text-muted-foreground">
              {onboarding.completed}/{onboarding.total} done · checked live
            </span>
          </span>
        </button>
        <button
          class="cursor-pointer rounded-md px-1.5 py-1 text-xs text-muted-foreground hover:bg-muted"
          title="Minimise - click the dot to bring it back"
          onclick={() => onboarding.setDismissed(true)}
        >
          ✕
        </button>
      </div>

      {#if onboarding.open}
        <ul class="max-h-[50svh] overflow-auto border-t border-border">
          {#each steps as step (step.id)}
            {@const done = onboarding.done[step.id]}
            <li class="group flex items-start gap-3 border-b border-border/60 px-4 py-2.5 last:border-b-0">
              <button
                class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border text-[11px] transition"
                class:border-transparent={done}
                class:bg-success={done}
                class:text-white={done}
                class:border-border={!done}
                class:cursor-pointer={!step.check}
                class:cursor-default={!!step.check}
                disabled={!!step.check}
                title={step.check ? 'Checked automatically' : 'Tick me when done'}
                onclick={() => onboarding.tick(step.id, !done)}
              >
                {done ? '✓' : ''}
              </button>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <span class="text-sm" class:line-through={done} class:text-muted-foreground={done}>
                    {step.title}
                  </span>
                  {#if step.href}
                    <a
                      href={step.href}
                      target={step.external ? '_blank' : undefined}
                      rel={step.external ? 'noreferrer' : undefined}
                      onclick={() => step.external && setFlag(step.id)}
                      class="ml-auto shrink-0 text-xs text-primary opacity-0 transition group-hover:opacity-100 hover:underline"
                    >
                      open ↗
                    </a>
                  {/if}
                </div>
                <p class="text-xs leading-snug text-muted-foreground">{step.hint}</p>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>
{/if}
`
