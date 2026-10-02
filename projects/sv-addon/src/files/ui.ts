import type { Ctx } from '../ctx.ts'
import { lines } from '../lines.ts'
import { APP } from './pages.ts'

/** Tailwind v4 semantic tokens (light + dark), remult flavored. */
export function themeCss(ctx: Ctx, firstlySource: string) {
  return lines(
    ``,
    `@custom-variant dark (&:where(.dark, .dark *));`,
    ctx.ff && `/* firstly ships Tailwind classes - let the scanner see them. */`,
    ctx.ff && `@source '${firstlySource}';`,
    ``,
    `/* ─────────────────────────────────────────────────────────────`,
    `   Rebrand in 3 lines: hue drives every accent, radius the shape.`,
    `   Everything below is derived from these.`,
    `   ───────────────────────────────────────────────────────────── */`,
    `:root {`,
    `  --brand-hue: 254;`,
    `  --brand-chroma: 0.18;`,
    `  --radius: 0.75rem;`,
    `}`,
    ``,
    `:root {`,
    `  --background: oklch(0.99 0.002 260);`,
    `  --foreground: oklch(0.22 0.03 265);`,
    `  --card: oklch(1 0 0);`,
    `  --card-foreground: var(--foreground);`,
    `  --muted: oklch(0.96 0.005 260);`,
    `  --muted-foreground: oklch(0.52 0.02 265);`,
    `  --border: oklch(0.91 0.008 265);`,
    `  --input: var(--border);`,
    `  --primary: oklch(0.52 var(--brand-chroma) var(--brand-hue));`,
    `  --primary-foreground: oklch(0.99 0 0);`,
    `  --accent: oklch(0.95 0.03 var(--brand-hue));`,
    `  --accent-foreground: oklch(0.3 0.1 var(--brand-hue));`,
    `  --destructive: oklch(0.58 0.22 27);`,
    `  --destructive-foreground: oklch(0.99 0 0);`,
    `  --success: oklch(0.65 0.16 155);`,
    `  --ring: var(--primary);`,
    `  color-scheme: light;`,
    `}`,
    ``,
    `.dark {`,
    `  --background: oklch(0.17 0.02 268);`,
    `  --foreground: oklch(0.95 0.01 260);`,
    `  --card: oklch(0.21 0.025 268);`,
    `  --card-foreground: var(--foreground);`,
    `  --muted: oklch(0.26 0.02 268);`,
    `  --muted-foreground: oklch(0.7 0.02 265);`,
    `  --border: oklch(0.3 0.02 268);`,
    `  --input: var(--border);`,
    `  --primary: oklch(0.72 calc(var(--brand-chroma) * 0.85) var(--brand-hue));`,
    `  --primary-foreground: oklch(0.16 0.03 268);`,
    `  --accent: oklch(0.3 0.05 var(--brand-hue));`,
    `  --accent-foreground: oklch(0.93 0.02 260);`,
    `  --destructive: oklch(0.62 0.2 25);`,
    `  --destructive-foreground: oklch(0.99 0 0);`,
    `  --success: oklch(0.7 0.15 155);`,
    `  --ring: var(--primary);`,
    `  color-scheme: dark;`,
    `}`,
    ``,
    `@theme inline {`,
    `  --color-background: var(--background);`,
    `  --color-foreground: var(--foreground);`,
    `  --color-card: var(--card);`,
    `  --color-card-foreground: var(--card-foreground);`,
    `  --color-muted: var(--muted);`,
    `  --color-muted-foreground: var(--muted-foreground);`,
    `  --color-border: var(--border);`,
    `  --color-input: var(--input);`,
    `  --color-primary: var(--primary);`,
    `  --color-primary-foreground: var(--primary-foreground);`,
    `  --color-accent: var(--accent);`,
    `  --color-accent-foreground: var(--accent-foreground);`,
    `  --color-destructive: var(--destructive);`,
    `  --color-destructive-foreground: var(--destructive-foreground);`,
    `  --color-success: var(--success);`,
    `  --color-ring: var(--ring);`,
    `  --radius-app: var(--radius);`,
    `}`,
    ``,
    `@layer base {`,
    `  body {`,
    `    @apply bg-background text-foreground antialiased;`,
    `  }`,
    `  ::selection {`,
    `    @apply bg-primary/20;`,
    `  }`,
    `}`,
    ``,
    `@utility card-app {`,
    `  @apply rounded-[var(--radius-app)] border border-border bg-card shadow-sm;`,
    `}`,
    ``,
    `@utility btn {`,
    `  @apply inline-flex h-8 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border px-3 text-sm font-medium transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50;`,
    `}`,
    ``,
    `@utility btn-primary {`,
    `  @apply border-transparent bg-primary text-primary-foreground hover:bg-primary/90;`,
    `}`,
    ``,
    `@utility input-app {`,
    `  @apply h-8 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring;`,
    `}`,
    ``,
  )
}

/** Runs before first paint: no white flash for dark-mode users. */
export const themeBootScript = `		<script>
			(() => {
				const saved = localStorage.getItem('theme')
				const dark = saved === 'dark' || (saved !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches)
				if (dark) document.documentElement.classList.add('dark')
			})()
		</script>
`

export function rootLayoutFile(ctx: Ctx, cssImport: string) {
  return lines(
    `<script lang="ts">`,
    `  import { remult } from 'remult'`,
    ctx.ff &&
      `  import { FF_DialogManager, FF_ToastManager, initRemultSvelteReactivity } from 'firstly/svelte'`,
    ctx.ff && `  import { stackHttpClient, stackSubscriptionClient, withShortTermCache, withTabSharing } from 'firstly'`,
    ``,
    ctx.auth && `  import { me } from '${ctx.mod}/auth/auth.remote.ts'`,
    cssImport && `  import '${cssImport}'`,
    ``,
    `  let { children } = $props()`,
    ``,
    ctx.ff && `  // Runes-aware remult: remult.user and every entity instance become reactive.`,
    ctx.ff && `  initRemultSvelteReactivity()`,
    ctx.ff && `  // One shared SSE connection for all tabs + a 2s read cache.`,
    ctx.ff && `  remult.apiClient.httpClient = stackHttpClient(withShortTermCache())`,
    ctx.ff && `  remult.apiClient.subscriptionClient = stackSubscriptionClient(withTabSharing())`,
    ctx.ff && ``,
    ctx.auth && `  // Fills remult.user on both sides - SSR resolves it in-process, the browser inherits`,
    ctx.auth && `  // the serialized value - and remult.user is reactive, so the whole UI follows.`,
    ctx.auth && `  remult.user = (await me()) ?? undefined`,
    `</script>`,
    ``,
    ctx.ff && `<FF_ToastManager />`,
    ctx.ff && `<FF_DialogManager />`,
    ctx.ff && ``,
    `{@render children()}`,
    ``,
  )
}

export function publicLayoutFile(ctx: Ctx) {
  return lines(
    `<script lang="ts">`,
    `  import PublicHeader from '${ctx.lib}/ui/PublicHeader.svelte'`,
    ``,
    `  let { children } = $props()`,
    `</script>`,
    ``,
    `<PublicHeader />`,
    ``,
    `{@render children()}`,
    ``,
  )
}

export function appLayoutFile(ctx: Ctx) {
  return lines(
    `<script lang="ts">`,
    `  import AppShell from '${ctx.lib}/ui/AppShell.svelte'`,
    ``,
    `  let { children } = $props()`,
    `</script>`,
    ``,
    `<AppShell>`,
    `  {@render children()}`,
    `</AppShell>`,
    ``,
  )
}

export function appShellFile(ctx: Ctx) {
  return lines(
    `<script lang="ts">`,
    `  import type { Snippet } from 'svelte'`,
    `  import { page } from '$app/state'`,
    ctx.auth && `  import { remult } from 'remult'`,
    ``,
    ctx.auth && `  import { backToMe } from '${ctx.mod}/auth/auth.remote.ts'`,
    ``,
    `  import { m } from '${ctx.lib}/paraglide/messages.js'`,
    `  import { site } from '${ctx.lib}/site.ts'`,
    `  import LocaleSwitch from './LocaleSwitch.svelte'`,
    ctx.onboarding && `  import Onboarding from './Onboarding.svelte'`,
    ctx.onboarding && ctx.admin && `  import { setFlag } from './onboarding.svelte.ts'`,
    `  import ThemeToggle from './ThemeToggle.svelte'`,
    ctx.auth && `  import UserMenu from '${ctx.mod}/auth/UserMenu.svelte'`,
    ``,
    `  let { children }: { children: Snippet } = $props()`,
    ``,
    `  const nav = [`,
    `    { href: '${APP}', label: m.nav_tasks(), icon: '◧' },`,
    ctx.internal && `    { href: '${APP}/internal', label: m.nav_internal(), icon: '⚙' },`,
    `  ]`,
    ``,
    ctx.auth && `  // Identity changed: reload so every query re-runs under the new user.`,
    ctx.auth && `  const switchBack = async () => {`,
    ctx.auth && `    await backToMe()`,
    ctx.auth && `    location.reload()`,
    ctx.auth && `  }`,
    ctx.auth && ``,
    `  const isActive = (href: string) =>`,
    `    href === '${APP}' ? page.url.pathname === '${APP}' : page.url.pathname.startsWith(href)`,
    `</script>`,
    ``,
    `<div class="flex min-h-svh">`,
    `  <aside class="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r border-border bg-card/50 p-4 md:flex">`,
    `    <a href="/" class="mb-6 flex items-center gap-2 px-2">`,
    `      <img src="/favicon.svg" alt="" class="size-8 rounded-lg" />`,
    `      <span class="truncate text-sm leading-tight font-semibold">{site.name}</span>`,
    `    </a>`,
    ``,
    `    <nav class="flex flex-col gap-1">`,
    `      {#each nav as item (item.href)}`,
    `        <a`,
    `          href={item.href}`,
    `          class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-muted"`,
    `          class:bg-accent={isActive(item.href)}`,
    `          class:text-accent-foreground={isActive(item.href)}`,
    `          class:font-medium={isActive(item.href)}`,
    `        >`,
    `          <span class="opacity-60">{item.icon}</span>`,
    `          {item.label}`,
    `        </a>`,
    `      {/each}`,
    ctx.admin && `      <a`,
    ctx.admin && `        href="/api/admin"`,
    ctx.admin && `        target="_blank"`,
    ctx.admin && `        rel="noreferrer"`,
    ctx.admin && ctx.onboarding && `        onclick={() => setFlag('admin')}`,
    ctx.admin &&
      `        class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-muted"`,
    ctx.admin && `      >`,
    ctx.admin && `        <span class="opacity-60">▦</span>`,
    ctx.admin && `        {m.nav_admin()}`,
    ctx.admin && `        <span class="ml-auto text-xs text-muted-foreground">↗</span>`,
    ctx.admin && `      </a>`,
    `    </nav>`,
    `  </aside>`,
    ``,
    `  <div class="flex min-w-0 flex-1 flex-col">`,
    `    <header class="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">`,
    `      <span class="truncate text-sm text-muted-foreground">{page.url.pathname}</span>`,
    `      <div class="ml-auto flex items-center gap-2">`,
    `        <LocaleSwitch />`,
    `        <ThemeToggle />`,
    ctx.auth && `        <UserMenu />`,
    `      </div>`,
    `    </header>`,
    ``,
    ctx.auth && `    {#if remult.user?.impersonatorName}`,
    ctx.auth &&
      `      <div class="border-b border-border bg-accent px-4 py-1.5 text-center text-xs text-accent-foreground">`,
    ctx.auth && `        {m.impersonating({ name: remult.user?.name ?? '?' })} \u00b7`,
    ctx.auth && `        <button class="cursor-pointer font-medium underline" onclick={switchBack}>`,
    ctx.auth && `          {m.back_to_real_user({ name: remult.user.impersonatorName })}`,
    ctx.auth && `        </button>`,
    ctx.auth && `      </div>`,
    ctx.auth && `    {/if}`,
    ``,
    `    <main class="mx-auto w-full max-w-4xl flex-1 p-4 pb-32 sm:p-8">`,
    `      {@render children()}`,
    `    </main>`,
    `  </div>`,
    `</div>`,
    ctx.onboarding && ``,
    ctx.onboarding && `<Onboarding />`,
    ``,
  )
}

export const themeToggleFile = `<script lang="ts">
  // The class is the source of truth: the boot script in app.html sets it before paint,
  // and CSS picks the icon - so there is nothing to hydrate and nothing to flash.
  const toggle = () => {
    const dark = document.documentElement.classList.toggle('dark')
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }
</script>

<button class="btn w-8 !px-0" aria-label="Toggle theme" onclick={toggle}>
  <span class="dark:hidden">\u2600</span>
  <span class="hidden dark:inline">\u263e</span>
</button>
`

export function userMenuFile(ctx: Ctx) {
  return `<script lang="ts">
  import { remult } from 'remult'

  import { backToMe, impersonationTargets, loginAs, signOut } from '${ctx.mod}/auth/auth.remote.ts'
  import { m } from '${ctx.lib}/paraglide/messages.js'

  let open = $state(false)

  // Admin-only on the server: a member receives an empty list.
  const users = await impersonationTargets()

  // Identity changed: reload so every query re-runs under the new user.
  const switchTo = async (fn: () => Promise<unknown>) => {
    localStorage.setItem('onboarding:loginAs', '1')
    await fn()
    location.reload()
  }
</script>

<div class="relative">
  <button class="btn" onclick={() => (open = !open)}>
    {#if remult.authenticated()}
      <span class="grid size-5 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">
        {(remult.user?.name ?? '?').slice(0, 1)}
      </span>
      {remult.user?.name}
      {#if remult.isAllowed('admin')}
        <span class="rounded bg-accent px-1.5 py-0.5 text-[10px] text-accent-foreground">admin</span>
      {/if}
    {:else}
      Anonymous
    {/if}
    <span class="opacity-50">▾</span>
  </button>

  {#if open}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="fixed inset-0 z-30" onclick={() => (open = false)} onkeydown={() => {}}></div>
    <div class="card-app absolute right-0 z-40 mt-2 w-64 overflow-hidden p-1 text-sm">
      {#if remult.user?.impersonatorName}
        <button
          class="flex w-full cursor-pointer items-center gap-2 rounded-md bg-accent px-3 py-2 text-left font-medium text-accent-foreground"
          onclick={() => switchTo(backToMe)}
        >
          ↩ {m.back_to_real_user({ name: remult.user.impersonatorName })}
        </button>
        <div class="my-1 border-t border-border"></div>
      {/if}

      {#if users.length}
        <p class="px-3 py-2 text-xs tracking-wide text-muted-foreground uppercase">{m.login_as()}</p>
        {#each users as u (u.id)}
          <button
            class="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-muted"
            onclick={() => switchTo(() => loginAs(u.id))}
          >
            <span class="grid size-6 place-items-center rounded-full bg-muted text-[11px]">
              {u.name.slice(0, 1)}
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate">{u.name}</span>
              <span class="block truncate text-xs text-muted-foreground">{u.email}</span>
            </span>
          </button>
        {/each}
        <div class="my-1 border-t border-border"></div>
      {/if}

      <button
        class="w-full cursor-pointer rounded-md px-3 py-2 text-left hover:bg-muted"
        onclick={() => switchTo(signOut)}
      >
        {m.sign_out()}
      </button>
    </div>
  {/if}
</div>
`
}
