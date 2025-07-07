import { defineConfig } from 'vitepress'
import { DefaultTheme } from 'vitepress/theme'
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs'
import toolbarConfig from './toolbar-config.json'
import { fileURLToPath, URL } from 'node:url'
import { transformerTwoslash } from '@shikijs/vitepress-twoslash'
import fs from 'node:fs'
import path from 'node:path'

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
  {
    title: 'SvelteKit',
    path: 'sveltekit',
    additionalItems: [
      {
        text: 'Go further / Extra',
        link: '/docs/installation/framework/sveltekit#extra',
      },
    ],
  },
  {
    title: 'Next.js',
    path: 'react-next',
    additionalItems: [], // [{ text: "Appendix: Server-side Rendering", link: '/tutorials/react-next/appendix-1-get-server-side-props' }]
  },
  { title: 'SolidStart', path: 'solid-start' },
]

const sidebar = tutorials.reduce(
  (a, t) => {
    a[`/tutorials/${t.path}/`] = [
      {
        text: 'Tutorial',
        title: t.title ?? t.path,
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
            text: 'Creating a project',
            link: '/docs/creating-a-project',
          },
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
            text: 'Relations',
            link: '/docs/entity-relations',
            collapsed: true,
            items: [
              {
                text: 'Filtering and Relations',
                link: '/docs/filtering-and-relations',
              },
            ],
          },
          { text: 'Lifecycle Hooks', link: '/docs/lifecycle-hooks' },
          { text: 'Migrations', link: '/docs/migrations' },
          {
            text: 'Generate from Existing DB',
            link: '/docs/entities-codegen-from-db-schema',
          },
          {
            text: 'Offline Support',
            link: '/docs/offline-support',
          },
          {
            text: 'Active Record & EntityBase',
            link: '/docs/active-record',
            collapsed: true,
            items: [
              {
                text: 'Entity Backend Methods',
                link: '/docs/entity-backend-methods',
              },
              {
                text: 'Mutable Controllers',
                link: '/docs/mutable-controllers',
              },
            ],
          },
        ],
      },
      {
        text: 'Stacks',
        link: '/docs/installation/',
        items: [
          {
            text: 'Framework',
            link: '/docs/installation/framework/',
            collapsed: true,
            items: [
              {
                text: 'React',
                link: '/docs/installation/framework/react',
              },
              {
                text: 'Angular',
                link: '/docs/installation/framework/angular',
              },
              {
                text: 'Vue',
                link: '/docs/installation/framework/vue',
              },
              {
                text: 'Sveltekit',
                link: '/docs/installation/framework/sveltekit',
              },
              {
                text: 'Next.js',
                link: '/docs/installation/framework/nextjs',
              },
              {
                text: 'SolidStart',
                link: '/docs/installation/framework/solid',
              },
              {
                text: 'Nuxt',
                link: '/docs/installation/framework/nuxt',
              },
            ],
          },
          {
            text: 'Server',
            link: '/docs/installation/server/',
            collapsed: true,
            items: [
              {
                text: 'Express',
                link: '/docs/installation/server/express',
              },
              {
                text: 'Fastify',
                link: '/docs/installation/server/fastify',
              },
              {
                text: 'Hono',
                link: '/docs/installation/server/hono',
              },
              {
                text: 'Elysia',
                link: '/docs/installation/server/elysia',
              },
              {
                text: 'Hapi',
                link: '/docs/installation/server/hapi',
              },
              {
                text: 'Koa',
                link: '/docs/installation/server/koa',
              },
              {
                text: 'nest',
                link: '/docs/installation/server/nest',
              },
            ],
          },
          {
            text: 'Database',
            link: '/docs/installation/database/',
            collapsed: true,
            items: [
              {
                text: 'PostgreSQL',
                link: '/docs/installation/database/postgresql',
              },
              {
                text: 'MySQL',
                link: '/docs/installation/database/mysql',
              },
              {
                text: 'MongoDB',
                link: '/docs/installation/database/mongodb',
              },
              {
                text: 'SQLite3',
                link: '/docs/installation/database/sqlite3',
              },
              {
                text: 'Better SQLite3',
                link: '/docs/installation/database/better-sqlite3',
              },
              {
                text: 'sqljs',
                link: '/docs/installation/database/sqljs',
              },
              {
                text: 'MSSQL',
                link: '/docs/installation/database/mssql',
              },
              {
                text: 'Bun SQLite',
                link: '/docs/installation/database/bun-sqlite',
              },
              {
                text: 'Turso',
                link: '/docs/installation/database/turso',
              },
              {
                text: 'DuckDb',
                link: '/docs/installation/database/duckdb',
              },
              {
                text: 'Oracle',
                link: '/docs/installation/database/oracle',
              },
              {
                text: 'D1',
                link: '/docs/installation/database/d1',
              },
              {
                text: 'Json files',
                link: '/docs/installation/database/json',
              },
            ],
          },
        ],
      },
      {
        text: 'Server-side Code',
        items: [
          {
            text: 'Backend Methods',
            link: '/docs/backendMethods',
          },
          {
            text: 'Server-only Dependencies',
            link: '/docs/using-server-only-packages',
          },
        ],
      },
      {
        text: 'Guides',
        items: [
          {
            text: 'Access Control',
            link: '/docs/access-control',
          },
          {
            text: 'Admin UI',
            link: '/docs/admin-ui',
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
            text: 'Using in Non-Remult Routes',
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
          { text: 'LLMs', link: '/docs/llms' },
        ],
      },
      {
        text: 'API Reference',
        collapsed: true,
        items: [
          { text: 'Entity', link: '/docs/ref_entity' },
          { text: 'Field', link: '/docs/ref_field' },
          { text: 'ValueConverter', link: '/docs/ref_valueconverter' },
          { text: 'Validation', link: '/docs/validation' },
          { text: 'Validators', link: '/docs/ref_validators' },

          { text: 'Relations', link: '/docs/ref_relations' },
          { text: 'RelationOptions', link: '/docs/ref_relationoptions' },
          { text: 'Remult', link: '/docs/ref_remult' },
          { text: 'ApiClient', link: '/docs/ref_apiclient' },
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
          { text: 'LiveQuery', link: '/docs/ref_livequery' },
          {
            text: 'LiveQueryChangeInfo',
            link: '/docs/ref_livequerychangeinfo',
          },
          { text: 'Filter', link: '/docs/ref_filter' },
          { text: 'Sort', link: '/docs/ref_sort' },
          { text: 'SqlDatabase', link: '/docs/ref_sqldatabase' },
          {
            text: 'SubscriptionChannel',
            link: '/docs/ref_subscriptionchannel',
          },
          {
            text: 'generateMigrations',
            link: '/docs/ref_generatemigrations',
          },
          { text: 'migrate', link: '/docs/ref_migrate' },
          { text: 'Async Hooks', link: '/docs/ref_initasynchooks' },
          { text: 'REST API Spec', link: '/docs/rest-api' },
          {
            text: 'Active Record & Mutable',
            collapsed: true,
            items: [
              {
                text: 'EntityBase',
                link: '/docs/ref_entitybase',
              },
              {
                link: '/docs/ref_identity',
                text: 'IdEntity',
              },
              {
                link: '/docs/ref_entityref',
                text: 'EntityRef',
              },
              {
                link: '/docs/ref_fieldref',
                text: 'FieldRef',
              },
              {
                link: '/docs/ref_getentityref',
                text: 'getEntityRef',
              },
              {
                link: '/docs/ref_getfields',
                text: 'getFields',
              },
            ],
          },
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
)

// https://vitepress.dev/reference/site-config
export default defineConfig({
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
    plugins: [
      {
        name: 'llms',
        buildStart() {
          // Now let's get also all the content from the interactive tutorials
          // Get all md files under (docs/interactive/src/content/tutorial)
          type MdFile = {
            fullPath: string
            dir: string
            contentRaw: string
            title: string
          }
          const getAllMdFiles = (
            dir: string,
            parentTitles: string[] = [],
          ): MdFile[] => {
            const files = fs.readdirSync(dir, { withFileTypes: true })
            const toRet: MdFile[] = []

            for (const file of files) {
              const fullPath = path.join(dir, file.name)
              if (file.isDirectory()) {
                // Get the directory's index.md to find its title
                const indexPath = path.join(fullPath, 'meta.md')
                let dirTitle = ''
                try {
                  const indexContent = fs.readFileSync(indexPath, 'utf-8')
                  const indexFrontmatter = parseFrontmatter(indexContent)
                  dirTitle = indexFrontmatter?.title || ''
                } catch (e) {}
                const newTitles = dirTitle
                  ? [...parentTitles, dirTitle]
                  : parentTitles
                toRet.push(...getAllMdFiles(fullPath, newTitles))
              } else if (file.name.endsWith('.md')) {
                const content = fs.readFileSync(fullPath, 'utf-8')
                const frontmatter = parseFrontmatter(content)
                const fileTitle = frontmatter?.title || ''
                const fullTitle = fileTitle
                  ? [...parentTitles, fileTitle].join(' - ')
                  : parentTitles.join(' - ')

                toRet.push({
                  fullPath,
                  dir,
                  contentRaw: frontmatter?.contentRaw || '',
                  title: fullTitle,
                })
              }
            }

            return toRet
          }

          const parseFrontmatter = (content: string) => {
            const frontmatterRegex = /^---\n([\s\S]*?)\n---/
            const match = content.match(frontmatterRegex)
            if (!match) return { contentRaw: content }

            try {
              const frontmatterBlock = match[1]
              const frontmatterLines = frontmatterBlock.split('\n')
              const frontmatter: Record<string, string> = {}

              frontmatterLines.forEach((line) => {
                const [key, ...valueParts] = line.split(':')
                if (key && valueParts.length) {
                  // Remove surrounding quotes and trim whitespace
                  const value = valueParts.join(':').trim()
                  frontmatter[key.trim()] = value.replace(
                    /^["'](.*)["']$/,
                    '$1',
                  )
                }
              })

              // Add contentRaw with the content without frontmatter
              frontmatter.contentRaw = content.replace(match[0], '').trim()

              return frontmatter
            } catch (e) {
              console.warn('Error parsing frontmatter:', e)
              return null
            }
          }

          const flattenItems = (items: any[], prefix = '') => {
            return items.flatMap((item) => {
              const title = prefix ? `${prefix} - ${item.text}` : item.text
              const result: { title: string; path: string; link: string }[] = []

              if (item.link) {
                const path = item.link.endsWith('/')
                  ? `${item.link}index.md`
                  : `${item.link.split('#')[0]}.md`
                result.push({
                  title,
                  path: path.startsWith('/') ? `.${path}` : path,
                  link: item.link,
                })
              }

              if (item.items) {
                const titleArr: string[] = []
                if (item.title) titleArr.push(item.title)
                if (item.text) titleArr.push(item.text)
                const prefix = titleArr.join(' - ')
                result.push(...flattenItems(item.items, prefix))
              }

              return result
            })
          }

          const format = (e: { title: string; path: string; link: string }[]) =>
            e
              .map(({ title, path, link }) => {
                try {
                  const content = fs.readFileSync(path, 'utf-8')
                  const frontmatter = parseFrontmatter(content)
                  const finalTitle = frontmatter?.title || title
                  return `# ${finalTitle}\n\n${frontmatter?.contentRaw}\n\n`
                } catch (e) {
                  console.warn(`Could not read file: ${path}`)
                  return `# ${title}\n\n[Content not found]\n\n`
                }
              })
              .join('\n')

          const docsContent = Object.entries(sidebar).flatMap(
            ([section, items]) => {
              return flattenItems(items)
            },
          )

          const interactiveFiles = getAllMdFiles(
            './interactive/src/content/tutorial/',
          )

          const linkToSkip = ['/docs/llms']
          fs.writeFileSync(
            'public/llms-full.txt',
            format(
              docsContent.filter(({ link }) => !linkToSkip.includes(link)),
            ) +
              interactiveFiles
                .filter((c) => c.contentRaw)
                .map((c) => {
                  return `# Interactive Tutorial - ${c.title}\n\n${c.contentRaw}\n\n`
                })
                .join('\n'),
          )

          fs.writeFileSync(
            'public/llms-small.txt',
            format(
              docsContent.filter(
                ({ link }) =>
                  !linkToSkip.includes(link) && !link.startsWith('/tutorials'),
              ),
            ),
          )

          // Keep the existing llms.txt write
          fs.writeFileSync(
            'public/llms.txt',
            `# Remult

> remult is a library for building full-stack TypeScript apps. 
Boost your TypeScript stack with SSOT entities and say goodbye to boilerplate code.

## Notes
 - SSOT stands for Single Source of Truth, this is the main concept of remult, you define once and use everywhere.
 - remult is not tightly coupled with any framework, it can be used with a lot of different stacks.
 
## Documentation Sets
- [/llms-small.txt](/llms-small.txt) - complete documentation for remult
- [/llms-full.txt](/llms-full.txt) - complete documentation for remult with all tutorials _(including the interactive one)_`,
          )
        },
      },
    ],
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
