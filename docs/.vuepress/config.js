const { description } = require('../../projects/core/package')
//const apiSideBar = require('./api-sidebar.json');
module.exports = {
  /**
   * Ref：https://v1.vuepress.vuejs.org/config/#title
   */
  title: 'Remult',
  /**
   * Ref：https://v1.vuepress.vuejs.org/config/#description
   */
  description: description,

  /**
   * Extra tags to be injected to the page HTML `<head>`
   *
   * ref：https://v1.vuepress.vuejs.org/config/#head
   */
  head: [
    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }],
    ['link', { rel: 'icon', href: '/favicon.png' }]
  ],

  /**
   * Theme configuration, here is the default theme configuration for VuePress.
   *
   * ref：https://v1.vuepress.vuejs.org/theme/default-theme-config.html
   */
  themeConfig: {
    logo: '/logo.png',
    repo: 'remult/remult',

    editLinks: true,
    docsDir: 'docs',
    lastUpdated: true,
    smoothScroll: true,
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
        text: 'Discord',
        link: 'https://discord.gg/GXHk7ZfuG5'
      }
    ],
    sidebar: {

      '/docs/': [
        {
          title: 'Getting Started',
          collapsable: false,
          children: [
            '',
            'add-remult-to-your-app',
            'crud-your-first-entity',
            'databases',
          ]
        },
        {
          title: 'Concepts',
          collapsable: true,
          children: [
            'field-types',
            'backendMethods',
            'entity-relations',
          ]
        },
        {
          title: 'Advanced Topics',
          collapsable: true,

          children: [
            'custom-filter',
            'custom-options',
            'working-without-decorators',
            'rest-api',
            'techniques-regarding-one-to-many-relations.md',
            'adding-swagger',
            'adding-graphql',
            'lazy-loading-of-related-entities',
            'using-remult-in-custom-backend-code',
            'using-server-only-packages',
            'running-sql-on-the-server'
          ]
        },
        {
          title: 'API Reference',
          collapsable: true,
          children: [
            'ref_entity',
            'ref_field',
            'ref_remult',
            'ref_repository',
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
          title: 'Tutorial',
          path: '/tutorials/react/',

          collapsable: false,
          children: [
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
          title: 'Tutorial',
          path: '/tutorials/angular/',

          collapsable: false,
          children: [
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
          title: 'Tutorial',
          path: '/tutorials/vue/',

          collapsable: false,
          children: [
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
          title: 'Tutorial',
          path: '/tutorials/react-next/',

          collapsable: false,
          children: [
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

    }
  },

  /**
   * Apply plugins，ref：https://v1.vuepress.vuejs.org/zh/plugin/
   */
  plugins: [
    '@vuepress/plugin-back-to-top',
    '@vuepress/plugin-medium-zoom',
    ['vuepress-plugin-code-copy', true],
    ['@vuepress/google-analytics',
      {
        'ga': 'UA-212489509-1'
      }]
  ]
}
