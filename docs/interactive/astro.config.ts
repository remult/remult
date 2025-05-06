import tutorialkit from '@tutorialkit/astro'
import { defineConfig } from 'astro/config'

export default defineConfig({
  devToolbar: {
    enabled: false,
  },
  publicDir: './public',

  integrations: [
    tutorialkit({
      components: {
        TopBar: './src/components/TopBar.astro',
      },
    }),
  ],
})
