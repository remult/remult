import type { Ctx } from '../ctx.ts'
import { lines } from '../lines.ts'

export const APP = '/app'

// ---------------------------------------------------------------- landing

export function landingPage(ctx: Ctx) {
  return lines(
    `<script lang="ts">`,
    `  import { m } from '${ctx.lib}/paraglide/messages.js'`,
    `  import { site } from '${ctx.lib}/site.ts'`,
    `  import SiteHead from '${ctx.lib}/ui/SiteHead.svelte'`,
    ``,
    `  // Edit the copy in messages/*.json, the identity in src/lib/site.ts,`,
    `  // and the colours in the :root block of your stylesheet. That is the whole theme.`,
    `  const points = [`,
    `    { icon: '◆', title: 'One class, one table', body: m.landing_point_entities() },`,
    `    { icon: '◇', title: 'Live by default', body: m.landing_point_live() },`,
    `    { icon: '◈', title: 'Rules on the server', body: m.landing_point_rules() },`,
    `  ]`,
    ``,
    `  const entitySnippet = \`${entitySnippetCode(ctx).replace(/`/g, '\\`').replace(/\$/g, '\\$')}\``,
    ``,
    `  const shipped = [`,
    `    'REST API at /api',`,
    `    'TypeScript types, shared',`,
    `    'Validation, both sides',`,
    ctx.admin && `    'Admin UI at /api/admin',`,
    `    'Live queries over SSE',`,
    `  ].filter(Boolean)`,
    `</script>`,
    ``,
    `<SiteHead />`,
    ``,
    `<section class="relative isolate overflow-hidden">`,
    `  <div class="deco aurora"></div>`,
    `  <div class="deco grid-fade"></div>`,
    ``,
    `  <div class="relative mx-auto flex max-w-3xl flex-col items-center px-6 pt-24 pb-20 text-center">`,
    `    <span class="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">`,
    `      <span class="size-1.5 animate-pulse rounded-full bg-success"></span>`,
    `      remult${ctx.ff ? ' + firstly' : ''} + SvelteKit`,
    `    </span>`,
    ``,
    `    <h1 class="brand-ink text-6xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-7xl">`,
    `      {site.name}`,
    `    </h1>`,
    `    <p class="mt-5 max-w-xl text-lg text-balance text-muted-foreground">{site.tagline}</p>`,
    ``,
    `    <div class="mt-9 flex flex-wrap items-center justify-center gap-3">`,
    `      <a class="btn btn-primary h-10 px-5 shadow-lg shadow-primary/20" href="${APP}">`,
    `        {m.landing_cta()}`,
    `        <span aria-hidden="true">→</span>`,
    `      </a>`,
    `      <a class="btn h-10 px-5" href="https://remult.dev/docs" target="_blank" rel="noreferrer">`,
    `        {m.landing_docs()}`,
    `      </a>`,
    `    </div>`,
    `  </div>`,
    `</section>`,
    ``,
    `<section class="mx-auto grid max-w-5xl gap-8 px-6 pb-20 lg:grid-cols-[1.1fr_1fr] lg:items-center">`,
    `  <div class="card-app overflow-hidden">`,
    `    <div class="flex items-center gap-1.5 border-b border-border px-4 py-2.5">`,
    `      <span class="size-2.5 rounded-full bg-destructive/60"></span>`,
    `      <span class="size-2.5 rounded-full bg-muted-foreground/40"></span>`,
    `      <span class="size-2.5 rounded-full bg-success/60"></span>`,
    `      <span class="ml-2 font-mono text-xs text-muted-foreground">src/modules/task/Task.ts</span>`,
    `    </div>`,
    `    <pre class="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed"><code>{entitySnippet}</code></pre>`,
    `  </div>`,
    ``,
    `  <div>`,
    `    <h2 class="text-2xl font-semibold tracking-tight">Write the model. Get the app.</h2>`,
    `    <p class="mt-2 text-sm text-muted-foreground">`,
    `      That file is the contract. Everything below is generated from it - nothing to wire, nothing to keep in sync.`,
    `    </p>`,
    `    <ul class="mt-5 space-y-2 text-sm">`,
    `      {#each shipped as item (item)}`,
    `        <li class="flex items-center gap-2.5">`,
    `          <span class="grid size-5 shrink-0 place-items-center rounded-full bg-success/15 text-[10px] text-success">\u2713</span>`,
    `          {item}`,
    `        </li>`,
    `      {/each}`,
    `    </ul>`,
    `  </div>`,
    `</section>`,
    ``,
    `<section class="mx-auto grid max-w-5xl gap-4 px-6 pb-24 sm:grid-cols-3">`,
    `  {#each points as point (point.title)}`,
    `    <article class="card-app group p-5 transition hover:-translate-y-0.5 hover:shadow-md">`,
    `      <span class="grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground transition group-hover:scale-105">`,
    `        {point.icon}`,
    `      </span>`,
    `      <h3 class="mt-3 text-sm font-semibold">{point.title}</h3>`,
    `      <p class="mt-1 text-sm leading-snug text-muted-foreground">{point.body}</p>`,
    `    </article>`,
    `  {/each}`,
    `</section>`,
    ``,
    `<footer class="border-t border-border">`,
    `  <div class="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-6 py-6 text-xs text-muted-foreground">`,
    `    <span>{site.name}</span>`,
    `    <a class="hover:text-foreground" href="https://remult.dev/docs" target="_blank" rel="noreferrer">remult</a>`,
    ctx.ff && `    <a class="hover:text-foreground" href="https://firstly.fun" target="_blank" rel="noreferrer">firstly</a>`,
    `    <a class="hover:text-foreground" href="https://svelte.dev/docs/kit" target="_blank" rel="noreferrer">sveltekit</a>`,
    `    <a class="ml-auto hover:text-foreground" href="https://github.com/remult/remult" target="_blank" rel="noreferrer">`,
    `      \u2b50 star remult`,
    `    </a>`,
    `  </div>`,
    `</footer>`,
    ``,
    `<style>`,
    `  /* Decoration lives with the page it decorates - delete this block and nothing else breaks. */`,
    `  .deco {`,
    `    position: absolute;`,
    `    inset: 0;`,
    `    pointer-events: none;`,
    `  }`,
    `  .aurora {`,
    `    background:`,
    `      radial-gradient(60rem 30rem at 15% -10%, oklch(from var(--primary) l c h / 0.22), transparent 60%),`,
    `      radial-gradient(45rem 25rem at 90% 0%, oklch(from var(--primary) l c calc(h + 60) / 0.18), transparent 55%);`,
    `  }`,
    `  .grid-fade {`,
    `    background-image:`,
    `      linear-gradient(to right, var(--border) 1px, transparent 1px),`,
    `      linear-gradient(to bottom, var(--border) 1px, transparent 1px);`,
    `    background-size: 3rem 3rem;`,
    `    mask-image: radial-gradient(ellipse 80% 50% at 50% 0%, #000 40%, transparent 100%);`,
    `    opacity: 0.5;`,
    `  }`,
    `  .brand-ink {`,
    `    background: linear-gradient(100deg, var(--foreground) 10%, var(--primary) 55%, oklch(from var(--primary) l c calc(h + 40)) 100%);`,
    `    background-clip: text;`,
    `    color: transparent;`,
    `  }`,
    `</style>`,
    ``,
  )
}

/** Shown on the landing page - kept in sync with the real entity by hand, on purpose. */
function entitySnippetCode(ctx: Ctx) {
  return lines(
    ctx.ff ? `@FF_Entity<Task>('tasks', {` : `@Entity<Task>('tasks', {`,
    `  allowApiRead: true,`,
    ctx.auth ? `  allowApiInsert: Allow.authenticated,` : `  allowApiInsert: true,`,
    ctx.auth ? `  allowApiDelete: Roles.admin,` : `  allowApiDelete: true,`,
    `})`,
    `export class Task {`,
    `  @Fields.id() id!: string`,
    `  @Fields.string() title = ''`,
    `  @Fields.boolean() completed = false`,
    `}`,
  )
}

export function publicHeaderFile(ctx: Ctx) {
  return lines(
    `<script lang="ts">`,
    `  import { site } from '${ctx.lib}/site.ts'`,
    `  import LocaleSwitch from './LocaleSwitch.svelte'`,
    `  import ThemeToggle from './ThemeToggle.svelte'`,
    ``,
    ctx.auth && `  import { remult } from 'remult'`,
    `</script>`,
    ``,
    `<header class="flex h-14 items-center gap-3 px-4 sm:px-8">`,
    `  <a class="flex items-center gap-2 font-semibold" href="/">`,
    `    <img src="/favicon.svg" alt="" class="size-6 rounded" />`,
    `    {site.name}`,
    `  </a>`,
    `  <div class="ml-auto flex items-center gap-2">`,
    `    <LocaleSwitch />`,
    `    <ThemeToggle />`,
    ctx.auth && `    <a class="btn" href={remult.authenticated() ? '${APP}' : '/login'}>`,
    ctx.auth && `      {remult.user?.name ?? 'Sign in'}`,
    ctx.auth && `    </a>`,
    !ctx.auth && `    <a class="btn" href="${APP}">Open</a>`,
    `  </div>`,
    `</header>`,
    ``,
  )
}

// ---------------------------------------------------------------- tasks

export function appHomePage(ctx: Ctx) {
  if (!ctx.crud) return welcomePage(ctx)
  return ctx.ff ? tasksPageFirstly(ctx) : tasksPagePlain(ctx)
}

function heroSnippet(ctx: Ctx) {
  return lines(
    `  <header class="mb-6">`,
    `    <h1 class="text-2xl font-semibold tracking-tight">{m.nav_tasks()}</h1>`,
    `    <p class="text-sm text-muted-foreground">`,
    `      One entity, zero API code.`,
    ctx.ff && `      Live over SSE, validated on both sides, permissions enforced server-side.`,
    !ctx.ff && `      Live over SSE, validated on both sides.`,
    `    </p>`,
    `  </header>`,
  )
}

function taskListMarkup(opts: { items: string; toggle: string; remove: string; setPriority: string }) {
  return lines(
    `  <div class="card-app divide-y divide-border">`,
    `    {#each ${opts.items} as task (task.id)}`,
    `      {@const canUpdate = meta.apiUpdateAllowed(task)}`,
    `      {@const canDelete = meta.apiDeleteAllowed(task)}`,
    `      <div class="group flex items-center gap-3 px-4 py-2.5">`,
    `        <input`,
    `          type="checkbox"`,
    `          class="size-4 accent-[var(--primary)] disabled:opacity-40"`,
    `          checked={task.completed}`,
    `          disabled={!canUpdate}`,
    `          onchange={() => ${opts.toggle}}`,
    `          aria-label="Toggle {task.title}"`,
    `        />`,
    `        <span class="min-w-0 flex-1 truncate text-sm" class:line-through={task.completed} class:text-muted-foreground={task.completed}>`,
    `          {task.title}`,
    `        </span>`,
    `        <select`,
    `          class="rounded-md border border-border bg-background px-1.5 py-1 text-xs disabled:opacity-40"`,
    `          value={task.priority}`,
    `          disabled={!canUpdate}`,
    `          onchange={(e) => ${opts.setPriority}}`,
    `        >`,
    `          {#each PRIORITIES as p (p)}`,
    `            <option value={p}>{p}</option>`,
    `          {/each}`,
    `        </select>`,
    `        <button`,
    `          class="rounded-md px-2 py-1 text-xs transition group-hover:opacity-100 sm:opacity-0 {canDelete`,
    `            ? 'cursor-pointer text-muted-foreground hover:bg-destructive/10 hover:text-destructive'`,
    `            : 'cursor-not-allowed text-muted-foreground/40'}"`,
    `          disabled={!canDelete}`,
    `          title={canDelete ? 'Delete' : 'Admins only - the entity says so'}`,
    `          onclick={() => ${opts.remove}}`,
    `        >`,
    `          delete`,
    `        </button>`,
    `      </div>`,
    `    {:else}`,
    `      <p class="px-4 py-10 text-center text-sm text-muted-foreground">Nothing here yet.</p>`,
    `    {/each}`,
    `  </div>`,
  )
}

function tasksPageFirstly(ctx: Ctx) {
  return lines(
    `<script lang="ts">`,
    `  import { ff, toast } from 'firstly/svelte'`,
    ``,
    `  import { m } from '${ctx.lib}/paraglide/messages.js'`,
    `  import { PRIORITIES, Task } from '${ctx.mod}/task/Task.ts'`,
    `  import SiteHead from '${ctx.lib}/ui/SiteHead.svelte'`,
    ``,
    `  let hideCompleted = $state(false)`,
    ``,
    `  // 'listen' = liveQuery: the list follows the database, in every tab.`,
    `  const tasks = ff(Task).many(() => ({ where: hideCompleted ? { completed: false } : {} }), 'listen')`,
    ``,
    `  // The entity knows what the current user may do - ask it, never guess in the markup.`,
    `  const meta = $derived(tasks.meta)`,
    ``,
    `  let title = $state('')`,
    ``,
    `  const add = async (e: SubmitEvent) => {`,
    `    e.preventDefault()`,
    `    tasks.create({ title })`,
    `    try {`,
    `      await tasks.save()`,
    `      title = ''`,
    `    } catch {`,
    `      // tasks.error holds the validation message, shown under the input.`,
    `    }`,
    `  }`,
    ``,
    `  const toggle = async (task: Task) => {`,
    `    task.completed = !task.completed`,
    `    await tasks.save(task).catch(toast.fromError)`,
    `  }`,
    ``,
    `  const setPriority = async (task: Task, priority: Task['priority']) => {`,
    `    task.priority = priority`,
    `    await tasks.save(task).catch(toast.fromError)`,
    `  }`,
    `</script>`,
    ``,
    `<SiteHead title={m.nav_tasks()} />`,
    ``,
    heroSnippet(ctx),
    ``,
    `<form class="mb-4 flex gap-2" onsubmit={add}>`,
    `  <input`,
    `    class="input-app"`,
    `    bind:value={title}`,
    `    disabled={!meta.apiInsertAllowed()}`,
    `    placeholder={meta.apiInsertAllowed() ? 'What needs to be done?' : 'Sign in to add a task'}`,
    `  />`,
    `  <button class="btn btn-primary" disabled={tasks.isWriting || !meta.apiInsertAllowed()}>Add</button>`,
    `</form>`,
    ``,
    `{#if tasks.error}`,
    `  <p class="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{tasks.error}</p>`,
    `{/if}`,
    ``,
    `<div class="mb-2 flex items-center gap-3 text-xs text-muted-foreground">`,
    `  <label class="flex cursor-pointer items-center gap-1.5">`,
    `    <input type="checkbox" class="size-3.5 accent-[var(--primary)]" bind:checked={hideCompleted} />`,
    `    hide completed`,
    `  </label>`,
    `  <span class="ml-auto">{tasks.items.length} shown{tasks.loading.fetching ? ' · syncing' : ''}</span>`,
    `</div>`,
    ``,
    taskListMarkup({
      items: 'tasks.items',
      toggle: 'toggle(task)',
      remove: 'tasks.confirmRemove(task)',
      setPriority: `setPriority(task, e.currentTarget.value as Task['priority'])`,
    }),
    ``,
    ctx.auth && `<p class="mt-4 text-xs text-muted-foreground">`,
    ctx.auth && `  Buttons follow <code class="rounded bg-muted px-1">meta.apiDeleteAllowed(task)</code> - the same rules`,
    ctx.auth && `  the server enforces, read off the entity. Admins can delete; members cannot.`,
    ctx.auth && `</p>`,
    ``,
  )
}

function tasksPagePlain(ctx: Ctx) {
  return lines(
    `<script lang="ts">`,
    `  import { repo } from 'remult'`,
    ``,
    `  import { m } from '${ctx.lib}/paraglide/messages.js'`,
    `  import { PRIORITIES, Task } from '${ctx.mod}/task/Task.ts'`,
    `  import SiteHead from '${ctx.lib}/ui/SiteHead.svelte'`,
    ``,
    `  let tasks = $state<Task[]>([])`,
    `  let hideCompleted = $state(false)`,
    `  let title = $state('')`,
    `  let error = $state('')`,
    ``,
    `  // liveQuery pushes every change (from any tab) over SSE.`,
    `  $effect(() =>`,
    `    repo(Task)`,
    `      .liveQuery({ where: { completed: hideCompleted ? false : undefined } })`,
    `      .subscribe((info) => (tasks = info.items)),`,
    `  )`,
    ``,
    `  const add = async (e: SubmitEvent) => {`,
    `    e.preventDefault()`,
    `    error = ''`,
    `    try {`,
    `      await repo(Task).insert({ title })`,
    `      title = ''`,
    `    } catch (e) {`,
    `      error = (e as { message?: string }).message ?? 'Something went wrong'`,
    `    }`,
    `  }`,
    ``,
    `  // The entity knows what the current user may do - ask it, never guess in the markup.`,
    `  const meta = $derived(repo(Task).metadata)`,
    ``,
    `  const toggle = (task: Task) => repo(Task).update(task.id, { completed: !task.completed })`,
    `  const setPriority = (task: Task, priority: Task['priority']) => repo(Task).update(task.id, { priority })`,
    `  const remove = (task: Task) => repo(Task).delete(task)`,
    `</script>`,
    ``,
    `<SiteHead title={m.nav_tasks()} />`,
    ``,
    heroSnippet(ctx),
    ``,
    `<form class="mb-4 flex gap-2" onsubmit={add}>`,
    `  <input`,
    `    class="input-app"`,
    `    bind:value={title}`,
    `    disabled={!meta.apiInsertAllowed()}`,
    `    placeholder={meta.apiInsertAllowed() ? 'What needs to be done?' : 'Sign in to add a task'}`,
    `  />`,
    `  <button class="btn btn-primary" disabled={!meta.apiInsertAllowed()}>Add</button>`,
    `</form>`,
    ``,
    `{#if error}`,
    `  <p class="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>`,
    `{/if}`,
    ``,
    `<div class="mb-2 flex items-center gap-3 text-xs text-muted-foreground">`,
    `  <label class="flex cursor-pointer items-center gap-1.5">`,
    `    <input type="checkbox" class="size-3.5 accent-[var(--primary)]" bind:checked={hideCompleted} />`,
    `    hide completed`,
    `  </label>`,
    `  <span class="ml-auto">{tasks.length} shown</span>`,
    `</div>`,
    ``,
    taskListMarkup({
      items: 'tasks',
      toggle: 'toggle(task)',
      remove: 'remove(task)',
      setPriority: `setPriority(task, e.currentTarget.value as Task['priority'])`,
    }),
    ``,
  )
}

function welcomePage(ctx: Ctx) {
  return lines(
    `<h1 class="text-2xl font-semibold tracking-tight">remult + SvelteKit</h1>`,
    `<p class="mt-2 text-sm text-muted-foreground">`,
    `  Your API lives at <code class="rounded bg-muted px-1">/api</code>. Add an entity in`,
    `  <code class="rounded bg-muted px-1">src/lib/entities</code> and it shows up there.`,
    `</p>`,
    ``,
  )
}

// ---------------------------------------------------------------- auth

export function appGuardFile(ctx: Ctx) {
  return `import { redirect } from '@sveltejs/kit'
import { remult } from 'remult'

export const load = async ({ url }) => {
  // The private half of the app: the API rules still apply, this is just the door.
  if (!remult.authenticated()) redirect(303, \`/login?redirectTo=\${encodeURIComponent(url.pathname)}\`)
  return {}
}
`
}

export function loginPage(ctx: Ctx) {
  return `<script lang="ts">
  import { page } from '$app/state'

  import { isFirstAccount, signIn } from '${ctx.mod}/auth/auth.remote.ts'
  import { m } from '${ctx.lib}/paraglide/messages.js'
  import SiteHead from '${ctx.lib}/ui/SiteHead.svelte'

  const redirectTo = $derived(page.url.searchParams.get('redirectTo') ?? '${APP}')
  const linkError = $derived(page.url.searchParams.get('error'))
</script>

<SiteHead title={m.login_title()} />

<div class="mx-auto max-w-md px-6 py-20">
  <h1 class="text-2xl font-semibold tracking-tight">{m.login_title()}</h1>

  {#if await isFirstAccount()}
    <p class="mt-1 mb-6 text-sm text-muted-foreground">
      Nobody here yet. <strong class="text-foreground">The first account becomes the admin</strong> -
      make it yours.
    </p>
  {:else}
    <p class="mt-1 mb-6 text-sm text-muted-foreground">
      No password: your email is the account. Unknown address? It is created on the spot.
    </p>
  {/if}

  {#if linkError}
    <p class="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{linkError}</p>
  {/if}

  {#if signIn.result?.pending}
    <div class="card-app p-4 text-sm">
      <p class="font-medium">Check your inbox</p>
      <p class="mt-1 text-muted-foreground">
        We sent a sign-in link to <strong class="text-foreground">{signIn.result.email}</strong>. It
        expires in 30 minutes.
      </p>
    </div>
  {:else}
    <form
      {...signIn.enhance(async (form) => {
        await form.submit()
        // Identity changed: a full load, so remult, the API rules and every query agree.
        if (signIn.result?.ok) location.assign(redirectTo)
      })}
      class="card-app flex flex-col gap-3 p-4"
    >
      <label class="text-sm font-medium" for="email">Email</label>
      <input
        id="email"
        class="input-app"
        autocomplete="email"
        placeholder="you@example.com"
        {...signIn.fields.email.as('email')}
      />
      {#if signIn.result?.error}
        <p class="text-sm text-destructive">{signIn.result.error}</p>
      {/if}
      <button class="btn btn-primary self-start">{m.login_cta()}</button>
    </form>
  {/if}

  <p class="mt-4 text-xs text-muted-foreground">
    Sessions are a signed cookie, read by <code class="rounded bg-muted px-1">getUser()</code> on
    every request. Turn on <code class="rounded bg-muted px-1">REQUIRE_EMAIL_VERIFICATION</code> to
    make people click a mailed link first.
  </p>
</div>
`
}

export function errorPage(ctx: Ctx) {
  return `<script lang="ts">
  import { page } from '$app/state'

  import { site } from '${ctx.lib}/site.ts'

  // Kit's own messages ('Not Found', 'Internal Error') say less than our copy does.
  const BORING = ['Not Found', 'Internal Error', 'Forbidden']

  // Each status, explained as the line of code that produced it.
  const copy = $derived(
    {
      403: {
        title: 'Not your door',
        body: 'The server checked, and said no. That is the point: rules live on the entity.',
        code: \`remult.isAllowed(Roles.admin)\`,
        result: 'false',
      },
      404: {
        title: 'Nothing lives here',
        body: 'The link is wrong, or whatever was here is gone.',
        code: \`repo(Route).findId('\${page.url.pathname}')\`,
        result: 'null',
      },
      500: {
        title: 'That one is on us',
        body: 'The server tripped on the way. Your logs know more than this page does.',
        code: 'await handler(event)',
        result: 'throw',
      },
    }[page.status] ?? {
      title: 'Unexpected',
      body: 'Something went sideways.',
      code: 'await handler(event)',
      result: String(page.status),
    },
  )
</script>

<svelte:head><title>{page.status} \u00b7 {site.name}</title></svelte:head>

<div class="relative isolate flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 text-center">
  <div class="deco aurora"></div>
  <div class="deco grid-fade"></div>

  <p class="status" aria-hidden="true">{page.status}</p>

  <h1 class="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">{copy.title}</h1>
  <p class="mt-2 max-w-sm text-sm text-balance text-muted-foreground">{copy.body}</p>

  <div class="card-app mt-6 w-full max-w-md overflow-hidden text-left font-mono text-xs backdrop-blur">
    <div class="flex items-center gap-1.5 border-b border-border px-3 py-2">
      <span class="size-2 rounded-full bg-destructive/60"></span>
      <span class="size-2 rounded-full bg-muted-foreground/40"></span>
      <span class="size-2 rounded-full bg-success/60"></span>
    </div>
    <div class="space-y-1 px-3 py-3">
      <p class="truncate"><span class="mr-1.5 text-muted-foreground select-none">&gt;</span>{copy.code}</p>
      <p class="text-destructive">{copy.result}</p>
      {#if page.error?.message && !BORING.includes(page.error.message)}
        <p class="pt-1 text-muted-foreground">// {page.error.message}</p>
      {/if}
    </div>
  </div>

  <div class="mt-8 flex flex-wrap items-center justify-center gap-2">
    {#if page.status === 403}
      <a class="btn btn-primary" href="/login?redirectTo={page.url.pathname}">Sign in as someone else</a>
    {:else}
      <a class="btn btn-primary" href="${APP}">Back to the app</a>
    {/if}
    <a class="btn" href="/">Home</a>
  </div>
</div>

<style>
  .deco {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .aurora {
    background:
      radial-gradient(50rem 26rem at 50% -10%, oklch(from var(--primary) l c h / 0.25), transparent 60%),
      radial-gradient(40rem 22rem at 80% 100%, oklch(from var(--primary) l c calc(h + 60) / 0.16), transparent 55%);
  }
  .grid-fade {
    background-image:
      linear-gradient(to right, var(--border) 1px, transparent 1px),
      linear-gradient(to bottom, var(--border) 1px, transparent 1px);
    background-size: 3rem 3rem;
    mask-image: radial-gradient(ellipse 70% 60% at 50% 40%, #000 30%, transparent 100%);
    opacity: 0.45;
  }
  .status {
    font-size: clamp(6rem, 18vw, 10rem);
    font-weight: 800;
    line-height: 0.85;
    letter-spacing: -0.05em;
    font-variant-numeric: tabular-nums;
    background: linear-gradient(170deg, var(--foreground) 15%, oklch(from var(--primary) l c h / 0.3) 95%);
    background-clip: text;
    color: transparent;
  }
</style>
`
}

export function verifyPageServer(ctx: Ctx) {
  return `import { redirect } from '@sveltejs/kit'

import { verifySignInLink } from '${ctx.mod}/auth/auth.server.ts'

export const load = async (event) => {
  const result = await verifySignInLink(event, event.url.searchParams.get('token') ?? '')
  if ('error' in result) return { error: result.error }
  redirect(303, '${APP}')
}
`
}

export const verifyPage = `<script lang="ts">
  let { data } = $props()
</script>

<div class="mx-auto max-w-md px-6 py-20 text-center">
  <h1 class="text-2xl font-semibold tracking-tight">Sign-in link</h1>
  <p class="mt-2 text-sm text-destructive">{data.error}</p>
  <a class="btn mt-6" href="/login">Ask for a new one</a>
</div>
`

// ---------------------------------------------------------------- internal

type Tab = { href: string; label: string }

export function internalTabs(ctx: Ctx): Tab[] {
  return [
    { href: `${APP}/internal`, label: 'Overview' },
    ...(ctx.auth ? [{ href: `${APP}/internal/users`, label: 'Users' }] : []),
    ...(ctx.ff
      ? [
          { href: `${APP}/internal/crons`, label: 'Crons' },
          { href: `${APP}/internal/mails`, label: 'Mails' },
          { href: `${APP}/internal/sql`, label: 'SQL' },
        ]
      : []),
  ]
}

export function internalLayout(ctx: Ctx) {
  const tabs = internalTabs(ctx)
  return lines(
    `<script lang="ts">`,
    `  import { page } from '$app/state'`,
    ``,
    `  let { children } = $props()`,
    ``,
    `  const tabs = [`,
    ...tabs.map((t) => `    { href: '${t.href}', label: '${t.label}' },`),
    `  ]`,
    `</script>`,
    ``,
    `<nav class="mb-6 flex gap-1 border-b border-border">`,
    `  {#each tabs as tab (tab.href)}`,
    `    <a`,
    `      href={tab.href}`,
    `      class="-mb-px border-b-2 px-3 py-2 text-sm transition"`,
    `      class:border-primary={page.url.pathname === tab.href}`,
    `      class:font-medium={page.url.pathname === tab.href}`,
    `      class:border-transparent={page.url.pathname !== tab.href}`,
    `      class:text-muted-foreground={page.url.pathname !== tab.href}`,
    `    >`,
    `      {tab.label}`,
    `    </a>`,
    `  {/each}`,
    `</nav>`,
    ``,
    `{@render children()}`,
    ``,
  )
}

export function internalPage(ctx: Ctx) {
  return lines(
    `<script lang="ts">`,
    ctx.ff && `  import { Cron } from 'firstly/cron'`,
    `  import { repo } from 'remult'`,
    ``,
    `  import { Task } from '${ctx.mod}/task/Task.ts'`,
    ctx.auth && `  import { User } from '${ctx.mod}/auth/User.ts'`,
    `  import { serverFacts } from '${ctx.lib}/facts.remote.ts'`,
    ``,
    `  // Resolved during SSR and serialized into the page - no client round trip.`,
    `  const facts = await serverFacts()`,
    ``,
    `  const links = [`,
    `    { label: 'remult', docs: 'https://remult.dev/docs', repo: 'https://github.com/remult/remult' },`,
    ctx.ff && `    { label: 'firstly', docs: 'https://firstly.fun', repo: 'https://github.com/jycouet/firstly' },`,
    `    { label: 'sveltekit', docs: 'https://svelte.dev/docs/kit', repo: 'https://github.com/sveltejs/kit' },`,
    `  ]`,
    `</script>`,
    ``,
    `<h1 class="mb-1 text-xl font-semibold tracking-tight">Backstage</h1>`,
    `<p class="mb-6 text-sm text-muted-foreground">What this server is made of, right now.</p>`,
    ``,
    `<div class="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">`,
    `  <a class="card-app group flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-md" href="${APP}">`,
    `    <span class="grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground">\u25c6</span>`,
    `    <span>`,
    `      <span class="block text-2xl leading-none font-semibold tabular-nums">{await repo(Task).count()}</span>`,
    `      <span class="block text-xs text-muted-foreground">tasks</span>`,
    `    </span>`,
    `  </a>`,
    ctx.auth && `  <a class="card-app group flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-md" href="${APP}/internal/users">`,
    ctx.auth && `    <span class="grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground">\u25cf</span>`,
    ctx.auth && `    <span>`,
    ctx.auth && `      <span class="block text-2xl leading-none font-semibold tabular-nums">{await repo(User).count()}</span>`,
    ctx.auth && `      <span class="block text-xs text-muted-foreground">users</span>`,
    ctx.auth && `    </span>`,
    ctx.auth && `  </a>`,
    ctx.ff && `  <a class="card-app group flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-md" href="${APP}/internal/crons">`,
    ctx.ff && `    <span class="grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground">\u25f4</span>`,
    ctx.ff && `    <span>`,
    ctx.ff && `      <span class="block text-2xl leading-none font-semibold tabular-nums">{await repo(Cron).count()}</span>`,
    ctx.ff && `      <span class="block text-xs text-muted-foreground">cron runs</span>`,
    ctx.ff && `    </span>`,
    ctx.ff && `  </a>`,
    `  <a class="card-app group flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-md" href="/api/admin">`,
    `    <span class="grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground">\u25a6</span>`,
    `    <span>`,
    `      <span class="block text-2xl leading-none font-semibold tabular-nums">{facts.runtime.entities}</span>`,
    `      <span class="block text-xs text-muted-foreground">entities</span>`,
    `    </span>`,
    `  </a>`,
    `</div>`,
    ``,
    `<div class="grid gap-4 lg:grid-cols-2">`,
    `  <section class="card-app p-4">`,
    `    <h2 class="mb-3 text-xs tracking-wide text-muted-foreground uppercase">Runtime</h2>`,
    `    <dl class="space-y-2 text-sm">`,
    `      {#each Object.entries(facts.runtime) as [key, value] (key)}`,
    `        <div class="flex items-baseline justify-between gap-4">`,
    `          <dt class="text-muted-foreground">{key}</dt>`,
    `          <dd class="truncate font-mono text-xs">{value}</dd>`,
    `        </div>`,
    `      {/each}`,
    `      <div class="flex items-baseline justify-between gap-4">`,
    `        <dt class="text-muted-foreground">signed in as</dt>`,
    `        <dd class="truncate font-mono text-xs">{remult.user?.name ?? 'anonymous'}</dd>`,
    `      </div>`,
    `    </dl>`,
    `  </section>`,
    ``,
    `  <section class="card-app p-4">`,
    `    <h2 class="mb-3 text-xs tracking-wide text-muted-foreground uppercase">Modules</h2>`,
    `    <ul class="space-y-2 text-sm">`,
    `      {#each facts.modules as mod (mod.name)}`,
    `        <li class="flex items-center gap-2.5">`,
    `          <span class="size-1.5 rounded-full" class:bg-success={mod.on} class:bg-muted-foreground={!mod.on}></span>`,
    `          <span class="font-medium">{mod.name}</span>`,
    `          <span class="ml-auto text-xs text-muted-foreground">{mod.hint}</span>`,
    `        </li>`,
    `      {/each}`,
    `    </ul>`,
    `  </section>`,
    `</div>`,
    ``,
    `<div class="mt-4 flex flex-wrap items-center gap-2 text-xs">`,
    `  {#each links as link (link.label)}`,
    `    <a class="rounded-full border border-border px-2.5 py-1 text-muted-foreground transition hover:bg-muted hover:text-foreground" href={link.docs} target="_blank" rel="noreferrer">`,
    `      {link.label} docs`,
    `    </a>`,
    `    <a class="rounded-full border border-border px-2.5 py-1 text-muted-foreground transition hover:bg-muted hover:text-foreground" href={link.repo} target="_blank" rel="noreferrer">`,
    `      \u2b50 {link.label}`,
    `    </a>`,
    `  {/each}`,
    `</div>`,
    ``,
  ).replace(`import { repo } from 'remult'`, `import { remult, repo } from 'remult'`)
}

export function usersPage(ctx: Ctx) {
  return `<script lang="ts">
  import { ff, toast } from 'firstly/svelte'

  import { addMember, loginAs } from '${ctx.mod}/auth/auth.remote.ts'
  import { User } from '${ctx.mod}/auth/User.ts'

  const users = ff(User).many(() => ({}), 'listen')

  let email = $state('')

  const add = async (e: SubmitEvent) => {
    e.preventDefault()
    try {
      await addMember(email)
      email = ''
    } catch (err) {
      toast.fromError(err)
    }
  }

  // Identity changed: reload so every query re-runs under the new user.
  const become = async (id: string) => {
    await loginAs(id)
    location.reload()
  }
</script>

<h1 class="mb-1 text-xl font-semibold tracking-tight">Users</h1>
<p class="mb-4 text-sm text-muted-foreground">
  The people your API rules talk about. One click to see the app through their eyes.
</p>

<form class="mb-4 flex gap-2" onsubmit={add}>
  <input class="input-app" type="email" placeholder="teammate@example.com" bind:value={email} />
  <button class="btn whitespace-nowrap">Add member</button>
</form>

<div class="card-app divide-y divide-border">
  {#each users.items as user (user.id)}
    <div class="flex items-center gap-3 px-4 py-3 text-sm">
      <span class="grid size-8 place-items-center rounded-full bg-accent text-xs font-medium text-accent-foreground">
        {user.name.slice(0, 1).toUpperCase()}
      </span>
      <span class="min-w-0 flex-1">
        <span class="block truncate font-medium">{user.name}</span>
        <span class="block truncate text-xs text-muted-foreground">{user.email}</span>
      </span>
      <span class="hidden text-xs text-muted-foreground sm:block" title={user.roles.join(', ') || 'no role'}>
        {user.roles.includes('admin') ? 'admin' : 'member'}
      </span>
      <button class="btn" onclick={() => become(user.id)}>login as</button>
    </div>
  {/each}
</div>
`
}

export const cronsPage = `<script lang="ts">
  import { ff } from 'firstly/svelte'
  import { Cron } from 'firstly/cron'

  const runs = ff(Cron).many(() => ({ limit: 50 }), 'listen')

  const badge = (status: string) =>
    status === 'failed'
      ? 'bg-destructive/15 text-destructive'
      : status === 'ended'
        ? 'bg-success/15 text-success'
        : 'bg-muted text-muted-foreground'
</script>

<h1 class="mb-1 text-xl font-semibold tracking-tight">Crons</h1>
<p class="mb-6 text-sm text-muted-foreground">
  A <code class="rounded bg-muted px-1">heartbeat</code> job runs every 5 minutes (see
  <code class="rounded bg-muted px-1">src/lib/server/api.ts</code>). Every tick is stored, failures included.
</p>

<div class="card-app divide-y divide-border">
  {#each runs.items as run (run.id)}
    <div class="flex items-center gap-3 px-4 py-2.5 text-sm">
      <span class="font-medium">{run.topic}</span>
      <span class="rounded px-1.5 py-0.5 text-[10px] uppercase {badge(run.status)}">{run.status}</span>
      <span class="ml-auto text-xs text-muted-foreground">
        {run.startingAt?.toLocaleString()}
      </span>
    </div>
  {:else}
    <p class="px-4 py-10 text-center text-sm text-muted-foreground">
      No run yet - the first heartbeat lands within 5 minutes.
    </p>
  {/each}
</div>
`

export const mailsPage = `<script lang="ts">
  import { LastMails, WriteMail } from 'firstly/mail'
</script>

<h1 class="mb-1 text-xl font-semibold tracking-tight">Mails</h1>
<p class="mb-6 text-sm text-muted-foreground">
  Without SMTP credentials firstly falls back to an
  <a class="text-primary hover:underline" href="https://ethereal.email" target="_blank" rel="noreferrer">ethereal</a>
  test inbox, so nothing reaches a real person. Configure the transport in
  <code class="rounded bg-muted px-1">src/lib/server/api.ts</code>.
</p>

<div class="space-y-6">
  <WriteMail />
  <LastMails />
</div>
`

export function sqlPage(ctx: Ctx) {
  return `<script lang="ts">
  import { serverFacts } from '${ctx.lib}/facts.remote.ts'
</script>

<h1 class="mb-1 text-xl font-semibold tracking-tight">SQL</h1>

{#if (await serverFacts()).usingPostgres}
  <p class="mb-6 text-sm text-muted-foreground">
    Read-only by default (every query runs in a <code class="rounded bg-muted px-1">BEGIN READ ONLY</code>
    transaction). Results are logged to the browser console too, so an AI agent can read them.
  </p>
  {#await import('firstly/sqlAdmin') then { SqlAdmin }}
    <SqlAdmin />
  {/await}
{:else}
  <p class="card-app p-4 text-sm text-muted-foreground">
    You are on JSON files. Start postgres with <code class="rounded bg-muted px-1">docker compose up -d</code>,
    set <code class="rounded bg-muted px-1">DATABASE_URL</code> in <code class="rounded bg-muted px-1">.env</code>,
    restart - and this console lights up.
  </p>
{/if}
`
}
