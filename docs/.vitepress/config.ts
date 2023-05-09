import { link } from 'fs'
import { defineConfig } from 'vitepress'

const tutorials = [
  { name: "react" },
  { name: "angular" },
  { name: "vue" },
  {
    name: "next.js",
    additionalItems: [{ text: "Appendix: Server-side Rendering", link: '/tutorials/react-next/appendix-1-get-server-side-props' }]
  },
]

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Remult",
  description: "Build Full-stack, End-to-end Type-safe CRUD Apps without the Boilerplate",
  lastUpdated: true,
  ignoreDeadLinks: 'localhostLinks',

  themeConfig: {
    logo: '/logo.png',
    editLink: { pattern: "https://github.com/remult/remult/edit/master/docs/:path" },
    nav: [
      {
        text: 'Guide',
        link: '/docs/',
      },
      {
        text: 'Tutorials',
        items: tutorials.map(t => ({ text: t.name.charAt(0).toUpperCase() + t.name.slice(1), link: `/tutorials/${t.name}/` }))
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
            { text: "Introduction", link: '/docs/' },
            { text: "Add Remult to your App", link: '/docs/add-remult-to-your-app' },
            { text: "CRUD your first Entity", link: '/docs/crud-your-first-entity' },
            { text: "Connecting to a Database", link: '/docs/databases' },
          ]
        },
        {
          text: 'Entities',
          items: [
            { text: "Fields", link: '/docs/field-types' },
            {
              text: "Relations", link: '/docs/entity-relations', collapsed: true,
              items: [
                { text: "Lazy loading", link: '/docs/lazy-loading-of-related-entities' },
                { text: "More on One to Many", link: '/docs/techniques-regarding-one-to-many-relations' },
              ]
            },
          ]
        },
        {
          text: "Server-side Code",
          items: [
            {
              text: "Backend Methods", link: '/docs/backendMethods',
              collapsed: true,
              items: [
                { text: "Server-only Dependencies", link: '/docs/using-server-only-packages' },
              ]
            },

          ]
        },
        {
          text: 'Escape Hatches',

          items: [
            { text: "Custom/SQL Filters", link: '/docs/custom-filter' },
            { text: "Direct Database Access", link: '/docs/running-sql-on-the-server' },
            { text: "Remult within Express Routes", link: '/docs/using-remult-in-custom-backend-code' },
            { text: "Avoiding Decorators", link: '/docs/working-without-decorators' },
            { text: "Extensibility", link: '/docs/custom-options' },
            'rest-api',
          ]
        },
        {
          text: "Integrations", collapsed: true,
          items: [
            { text: "Open API", link: '/docs/adding-swagger' },
            { text: "GraphQL", link: '/docs/adding-graphql' },

          ]
        },
        {
          text: 'Reference',
          collapsed: true,
          items: [
            { text: "Entity", link: '/docs/ref_entity' },
            { text: "Field", link: '/docs/ref_field' },
            { text: "Remult", link: '/docs/ref_remult' },
            { text: "Repository", link: '/docs/ref_repository' },
            { text: "RemultServerOptions", link: '/docs/ref_remultserveroptions' },
            { text: "EntityFilter", link: '/docs/entityFilter' },
            { text: "EntityMetadata", link: '/docs/ref_entitymetadata' },
            { text: "FieldMetadata", link: '/docs/ref_fieldmetadata' },
            { text: "Allowed", link: '/docs/allowed' },
            { text: "BackendMethod", link: '/docs/ref_backendmethod' },
            { text: "QueryResult", link: '/docs/ref_queryresult' },
            { text: "Paginator", link: '/docs/ref_paginator' },
            { text: "REST API Specs", link: '/docs/rest-api' },
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
