import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Remult",
  description: "Build Full-stack, End-to-end Type-safe CRUD Apps without the Boilerplate",
  lastUpdated: true,

  themeConfig: {
    logo: '/logo.png',
    editLink: { pattern: "https://github.com/remult/remult/edit/master/docs/:path" },
    nav: [
      {
        text: 'Docs',
        link: '/docs/',
      },
      {
        text: 'Tutorials',
        items: [
          {
            text: 'React',
            link: '/tutorials/react/'
          },
          {
            text: 'Angular',
            link: '/tutorials/angular/'
          }
          ,
          {
            text: 'Vue',
            link: '/tutorials/vue/'
          },
          {
            text: 'Next.js',
            link: '/tutorials/react-next/'
          },
        ]
      },
      {
        text: 'Blog',
        link: '/blog/introducing-remult-part-1',

      }
    ],
    search: { provider: 'local', options: {} },
    socialLinks: [
      { icon: 'twitter', link: 'https://twitter.com/RemultJs' },
      { icon: 'youtube', link: 'https://www.youtube.com/@remult6539' },
      { icon: 'discord', link: 'https://discord.gg/GXHk7ZfuG5' },
      { icon: 'github', link: 'https://github.com/remult/remult' },
    ],
    sidebar: {

      '/docs/': [
        {
          text: 'Getting Started',
          items: [
            '',
            { text: "Add Remult to your App", link: '/docs/add-remult-to-your-app.md' },
            'crud-your-first-entity',
            'databases',
          ]
        },
        {
          text: 'Concepts',
          collapsed: true,
          items: [
            'field-types',
            'backendMethods',
            'entity-relations',
          ]
        },
        {
          text: 'Advanced Topics',
          collapsed: true,

          items: [
            'adding-graphql',
            'adding-swagger',
            'rest-api',
            'using-server-only-packages',
            'working-without-decorators',
            'custom-options',
            'techniques-regarding-one-to-many-relations.md',
            'running-sql-on-the-server',
            'custom-filter',
            'using-remult-in-custom-backend-code',
            'lazy-loading-of-related-entities',
          ]
        },
        {
          text: 'API Reference',
          collapsed: true,
          items: [
            'ref_entity',
            'ref_field',
            'ref_remult',
            'ref_repository',
            `ref_remultserveroptions`,
            'entityFilter',
            'ref_entitymetadata',
            'ref_fieldmetadata',
            'allowed',
            'ref_backendmethod',
            'ref_queryresult',
            `ref_paginator`
          ]
        }

      ],

      '/tutorials/react/': [
        {
          text: 'Tutorial',
          path: '/tutorials/react/',

          collapsed: false,
          items: [
            ['', 'Setup'],
            'entities',
            'sorting-filtering',
            'crud',
            'validation',
            'live-queries',
            'backend-methods',
            'auth',
            'database',
            'deployment'
          ]
        }],
      '/tutorials/angular/': [
        {
          text: 'Tutorial',
          path: '/tutorials/angular/',

          collapsed: false,
          items: [
            ['', 'Setup'],
            'entities',
            'sorting-filtering',
            'crud',
            'validation',
            'live-queries',
            'backend-methods',
            'auth',
            'database',
            'deployment'
          ]
        }],
      '/tutorials/vue/': [
        {
          text: 'Tutorial',
          path: '/tutorials/vue/',

          collapsed: false,
          items: [
            ['', 'Setup'],
            'entities',
            'sorting-filtering',
            'crud',
            'validation',
            'live-queries',
            'backend-methods',
            'auth',
            'database',
            'deployment'
          ]
        }],
      '/tutorials/react-next/': [
        {
          text: 'Tutorial',
          path: '/tutorials/react-next/',

          collapsed: false,
          items: [
            ['', 'Setup'],
            'entities',
            'sorting-filtering',
            'crud',
            'validation',
            'live-queries',
            'backend-methods',
            'auth',
            'database',
            'deployment',
            'appendix-1-get-server-side-props'
          ]
        }],
      '/blog/': [
        {
          text: 'Remult Blog',

          items: [
            'introducing-remult-part-1'
          ]
        }
      ]
    },
    footer: {
      message: "MIT Licensed | Made by the Remult team with ❤️"
    }
  },
})
