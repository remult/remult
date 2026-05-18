import { defineConfig } from 'vitepress'
import { DefaultTheme } from 'vitepress/theme'
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs'
import toolbarConfig from './toolbar-config.json'
import { fileURLToPath, URL } from 'node:url'
import { transformerTwoslash } from '@shikijs/vitepress-twoslash'
import { sidebar, tutorials } from './sidebar.mjs'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  // base: '/remult/',
  srcExclude: ['interactive'],
  title: toolbarConfig.title,
  description:
    'Build Full-stack, End-to-end Type-safe CRUD Apps without the Boilerplate',
  lastUpdated: true,
  ignoreDeadLinks: 'localhostLinks',
  cleanUrls: true,

  vite: {
    resolve: {
      alias: [
        {
          find: /^.*\/VPHome\.vue$/,
          replacement: fileURLToPath(
            new URL('../Homepage.vue', import.meta.url),
          ),
        },
      ],
    },
    build: {
      rollupOptions: {
        external: ['node:url'],
      },
    },
  },

  head: [
    ['link', { href: '/favicon.png', rel: 'icon', type: 'image/png' }],
    [
      'link',
      { href: '/favicon.png', rel: 'apple-touch-icon', sizes: '128x128' },
    ],
    [
      'script',
      {
        async: 'true',
        src: 'https://www.googletagmanager.com/gtag/js?id=G-RBX0REXJT3',
      },
    ],
    [
      'script',
      {},
      "window.dataLayer = window.dataLayer || [];\nfunction gtag(){dataLayer.push(arguments);}\ngtag('js', new Date());\ngtag('config', 'G-RBX0REXJT3');",
    ],
  ],

  themeConfig: {
    logo: {
      dark: '/logo-white.svg',
      light: '/logo-dark.svg',
    },
    editLink: {
      pattern: 'https://github.com/remult/remult/edit/main/docs/:path',
    },
    nav: [
      {
        text: 'Documentation',
        link: '/docs/',
      },
      {
        text: 'Tutorials',
        items: tutorials.map((t) => ({
          text:
            (t.title ?? t.path).charAt(0).toUpperCase() +
            (t.title ?? t.path).slice(1),
          link: `/tutorials/${t.path}/`,
        })),
      },
      // {
      //   text: 'Blog',
      //   link: '/blog/introducing-remult-part-1',
      // },
    ],
    search: { provider: 'local', options: {} },
    socialLinks: toolbarConfig.themeConfig.socialLinks.map(
      ({ link, icon }) => ({ link, icon: icon as DefaultTheme.SocialLinkIcon }),
    ),
    sidebar,

    footer: {
      message: 'MIT Licensed | Made by the Remult team with ❤️',
    },
  },

  markdown: {
    theme: 'tokyo-night',
    config(md) {
      md.use(tabsMarkdownPlugin)
    },
    codeTransformers: [transformerTwoslash({})],
  },
})
