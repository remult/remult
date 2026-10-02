import type { Ctx } from '../ctx.ts'

/** `my-cool-app` -> `My Cool App` */
export function titleize(name: string) {
  return name
    .split(/[-_.\s]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ')
}

export function siteFile(ctx: Ctx, name: string) {
  const title = titleize(name)
  return `/** One place for the app identity: <title>, OG tags, the landing hero. */
export const site = {
  name: '${title}',
  tagline: 'The great ${title}',
  description: 'The great ${title} - a full-stack, type-safe app built with remult${ctx.ff ? ', firstly' : ''} and SvelteKit.',
  /** Social preview. Swap for a .png before launch: X ignores SVG. */
  ogImage: '/og.svg',
}
`
}

export const siteHeadFile = (ctx: Ctx) => `<script lang="ts">
  import { page } from '$app/state'

  import { site } from '${ctx.lib}/site.ts'

  let { title, description = site.description }: { title?: string; description?: string } = $props()

  const full = $derived(title ? \`\${title} · \${site.name}\` : \`\${site.name} · \${site.tagline}\`)
  const image = $derived(new URL(site.ogImage, page.url.origin).href)
</script>

<svelte:head>
  <title>{full}</title>
  <meta name="description" content={description} />
  <meta property="og:title" content={full} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={image} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={page.url.href} />
  <meta name="twitter:card" content="summary_large_image" />
</svelte:head>
`

/** remult's mark, on a rounded dark tile so it works on any background. */
export const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <rect width="256" height="256" rx="56" fill="#050639" />
  <g transform="translate(46 32) scale(0.85)">
    <path d="M14.197 191.286V108.318H0.200439V83.729H14.197V0.760742H71.326V21.4669H62.8995C53.616 21.4669 41.0477 29.5192 40.4764 45.0488V144.985C40.4764 164.684 56.1868 170.292 63.1851 170.292H71.326V190.998H14.0542L14.197 191.286Z" fill="white"/>
    <path d="M176.729 0.904297V83.7288H190.726V108.317H176.729V191.286H102.319V170.579H127.655C136.939 170.579 149.507 162.527 150.078 146.997V114.644C150.078 110.719 152.521 109.496 157.305 110.086C162.09 110.676 164.432 107.411 164.475 104.478C164.675 91.7093 150.45 87.036 150.45 66.3299V47.0617C150.45 27.3621 134.739 21.7542 127.741 21.7542H103.89V1.04809H176.872L176.729 0.904297Z" fill="white"/>
    <path d="M117.215 81.1549C125.347 81.1549 131.94 74.5175 131.94 66.3299C131.94 58.1423 125.347 51.5049 117.215 51.5049C109.083 51.5049 102.49 58.1423 102.49 66.3299C102.49 74.5175 109.083 81.1549 117.215 81.1549Z" fill="white"/>
    <path d="M117.529 125.586C117.529 125.586 124.774 129.914 134.259 129.914C144.673 129.914 150.121 129.914 150.121 129.914V145.127H132.64C124.299 145.127 117.529 136.874 117.529 128.476V125.586Z" fill="white"/>
  </g>
</svg>
`

export function ogImageSvg(name: string, ctx: Ctx) {
  const title = titleize(name)
  const stack = `remult${ctx.ff ? ' + firstly' : ''} + SvelteKit`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" font-family="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#050639" />
      <stop offset="100%" stop-color="#0d2a6b" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)" />
  <circle cx="1040" cy="120" r="220" fill="#0066c8" opacity="0.25" />
  <text x="90" y="300" fill="#ffffff" font-size="96" font-weight="700">${title}</text>
  <text x="90" y="374" fill="#9fb6d9" font-size="40">The great ${title}</text>
  <text x="90" y="540" fill="#7f97bd" font-size="28" letter-spacing="2">${stack.toUpperCase()}</text>
</svg>
`
}
