import { defineConfig } from 'vitepress'
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs'

const tutorials = [
  { path: 'react' },
  {
    path: 'angular',
    additionalItems: [
      {
        text: 'Appendix: Observable Live Query',
        link: '/tutorials/angular/appendix-observable-live-query',
      },
    ],
  },
  { path: 'vue' },
  { title: 'SvelteKit', path: 'sveltekit' },
  {
    title: 'Next.js',
    path: 'react-next',
    additionalItems: [], // [{ text: "Appendix: Server-side Rendering", link: '/tutorials/react-next/appendix-1-get-server-side-props' }]
  },
]

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Remult',
  description:
    'Build Full-stack, End-to-end Type-safe CRUD Apps without the Boilerplate',
  lastUpdated: true,
  ignoreDeadLinks: 'localhostLinks',

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
    logo: '/logo.png',
    editLink: {
      pattern: 'https://github.com/remult/remult/edit/master/docs/:path',
    },
    nav: [
      {
        text: 'Guide',
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
      {
        text: 'Blog',
        link: '/blog/introducing-remult-part-1',
      },
    ],
    search: { provider: 'local', options: {} },
    socialLinks: [
      { icon: 'x', link: 'https://twitter.com/RemultJs' },
      { icon: 'youtube', link: 'https://www.youtube.com/@remult6539' },
      { icon: 'discord', link: 'https://discord.gg/GXHk7ZfuG5' },
      { icon: 'github', link: 'https://github.com/remult/remult' },
    ],
    sidebar: tutorials.reduce(
      (a, t) => {
        a[`/tutorials/${t.path}/`] = [
          {
            text: 'Tutorial',
            path: `/tutorials/${t.path}/`,

            items: [
              { text: 'Setup', link: `/tutorials/${t.path}/` },
              { text: 'Entities', link: `/tutorials/${t.path}/entities` },
              {
                text: 'Paging, Sorting and Filtering',
                link: `/tutorials/${t.path}/sorting-filtering`,
              },
              { text: 'CRUD Operations', link: `/tutorials/${t.path}/crud` },
              { text: 'Validation', link: `/tutorials/${t.path}/validation` },
              {
                text: 'Live Queries',
                link: `/tutorials/${t.path}/live-queries`,
              },
              {
                text: 'Backend methods',
                link: `/tutorials/${t.path}/backend-methods`,
              },
              {
                text: 'Authentication and Authorization',
                link: `/tutorials/${t.path}/auth`,
              },
              { text: 'Database', link: `/tutorials/${t.path}/database` },
              { text: 'Deployment', link: `/tutorials/${t.path}/deployment` },
              ...(t.additionalItems ?? []),
            ],
          },
        ]
        return a
      },
      {
        '/docs/': [
          {
            text: 'Getting Started',
            items: [
              { text: 'Introduction', link: '/docs/' },
              {
                text: 'Quickstart',
                link: '/docs/quickstart',
              },
              {
                text: 'Example Apps',
                link: '/docs/example-apps',
              },
            ],
          },
          {
            text: 'Entities',
            items: [
              { text: 'Fields', link: '/docs/field-types' },
              {
                text: 'Relations 🚀',
                link: '/docs/entity-relations',
                // collapsed: true,
                // items: [
                //   // {
                //   //   text: 'Lazy loading',
                //   //   link: '/docs/lazy-loading-of-related-entities',
                //   // },
                //   {
                //     text: 'More on One to Many',
                //     link: '/docs/techniques-regarding-one-to-many-relations',
                //   },
                // ],
              },
              { text: 'Lifecycle Hooks', link: '/docs/lifecycle-hooks' },
              {
                text: 'Generate from Existing DB',
                link: '/docs/entities-codegen-from-db-schema',
              },
            ],
          },
          {
            text: 'Server-side Code',
            items: [
              {
                text: 'Backend Methods',
                link: '/docs/backendMethods',
                collapsed: true,
                items: [
                  {
                    text: 'Server-only Dependencies',
                    link: '/docs/using-server-only-packages',
                  },
                ],
              },
            ],
          },
          {
            text: 'Escape Hatches',

            items: [
              { text: 'Custom/SQL Filters', link: '/docs/custom-filter' },
              {
                text: 'Direct Database Access',
                link: '/docs/running-sql-on-the-server',
              },
              {
                text: 'Remult within Express Routes',
                link: '/docs/using-remult-in-custom-backend-code',
              },
              {
                text: 'Avoiding Decorators',
                link: '/docs/working-without-decorators',
              },
              { text: 'Extensibility', link: '/docs/custom-options' },
            ],
          },
          {
            text: 'Integrations',
            collapsed: true,
            items: [
              { text: 'Open API', link: '/docs/adding-swagger' },
              { text: 'GraphQL', link: '/docs/adding-graphql' },
            ],
          },
          {
            text: 'API Reference',
            collapsed: true,
            items: [
              { text: 'Entity', link: '/docs/ref_entity' },
              { text: 'Field', link: '/docs/ref_field' },
              { text: 'Relations', link: '/docs/ref_relations' },
              { text: 'RelationOptions', link: '/docs/ref_relationoptions' },
              { text: 'Remult', link: '/docs/ref_remult' },
              { text: 'Repository', link: '/docs/ref_repository' },
              {
                text: 'RemultServerOptions',
                link: '/docs/ref_remultserveroptions',
              },
              { text: 'EntityFilter', link: '/docs/entityFilter' },
              { text: 'EntityMetadata', link: '/docs/ref_entitymetadata' },
              { text: 'FieldMetadata', link: '/docs/ref_fieldmetadata' },
              { text: 'Allowed', link: '/docs/allowed' },
              { text: 'BackendMethod', link: '/docs/ref_backendmethod' },
              { text: 'QueryResult', link: '/docs/ref_queryresult' },
              { text: 'Paginator', link: '/docs/ref_paginator' },
              { text: 'REST API Spec', link: '/docs/rest-api' },
            ],
          },
        ],

        '/blog/': [
          {
            text: 'Remult Blog',

            items: [
              {
                text: 'Introducing Remult',
                link: '/blog/introducing-remult-part-1',
              },
            ],
          },
        ],
      },
    ),

    footer: {
      message: 'MIT Licensed | Made by the Remult team with ❤️',
    },
  },
  markdown: {
    config(md) {
      md.use(tabsMarkdownPlugin)
    },
  },
})
