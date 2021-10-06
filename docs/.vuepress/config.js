const { description } = require('../../package')
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
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }]
  ],

  /**
   * Theme configuration, here is the default theme configuration for VuePress.
   *
   * ref：https://v1.vuepress.vuejs.org/theme/default-theme-config.html
   */
  themeConfig: {
    repo: '',
    editLinks: false,
    docsDir: '',
    editLinkText: '',
    lastUpdated: false,
    nav: [
      {
        text: 'Tutorials',
        link: '/tutorials/',
      },
      {
        text: 'Guide',
        link: '/guide/',
      }/*,
      {
        text: 'Config',
        link: '/config/'
      },
      {
        text: 'VuePress',
        link: 'https://v1.vuepress.vuejs.org'
      }*/
    ],
    sidebar: {
      '/guide/': [
        {
          title: 'Getting Started',
          collapsable: false,
          children: [
            '']
        },
        {
          title: 'Tutorial',
          collapsable: false,
          children: [
            'tutorial-angular']
        },
        {
          title: 'API Reference',
          collapsable: true,
          children: [
            'ref_entity',
            'ref_field',
            'ref_backendmethod',
            'ref_repository',
            'ref_entitywhere',
            'ref_entityorderby'


          ]
        }

      ]
    }
  },

  /**
   * Apply plugins，ref：https://v1.vuepress.vuejs.org/zh/plugin/
   */
  plugins: [
    '@vuepress/plugin-back-to-top',
    '@vuepress/plugin-medium-zoom',
    ['vuepress-plugin-code-copy', true]
  ]
}
