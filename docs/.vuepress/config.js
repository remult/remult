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
          title: 'Guide',
          collapsable: false,
          children: [
            '',
            '05-Installing-a-Dev-Machine',
            '10-Creating-a-new-Project',
            '15-Running-the-Development-Environment',
            '20-Hello-Angular',
            '25-Adding-the-Products-Component',
            '30-Adding the Products Entity',

            //'40-Adding Validations',
            //'45-Configuring the DataGrid and DataArea',
            //'50-Settings Default Values for New Rows',
            '55-Displaying the Products Entity using Custom Html',
            //'60-Adding Product Categories',
            //'65-Creating a CategoryId column type',
            '70-Batch Operations',
            '75-Moving Logic to the Server',
            '80-Users and Security',
            '85-Deployment',
            {
              title: 'Further Reading',
              collapsable: true,
              children: [
                'architecture',
                'dialog',
                'entity',
                'allowed',
                '81-Adding a new Role',
                'using-server-only-packages',
                'running-sql-on-the-server',
                'rest-api',
                'further-learning',
                'VSCode-keyboard-shortcuts'
              ]
            },
            {
              title: 'Reference',
              collapsable: true,
              children: [
                'ref_entity',
                'ref_entityoptions',
                'ref_findoptions',
                'ref_specificentityhelper',
                'ref_entitywhere',
                'ref_entityorderby'

              ]
            }

          ]
        }
      ]
      ,
    }
  },

  /**
   * Apply plugins，ref：https://v1.vuepress.vuejs.org/zh/plugin/
   */
  plugins: [
    '@vuepress/plugin-back-to-top',
    '@vuepress/plugin-medium-zoom',
  ]
}
