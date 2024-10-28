import { defineConfig } from '@tutorialkit/theme'
import { presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetIcons({
      collections: {
        ri: () => import('@iconify-json/ri').then((i) => i.icons), // Add this line
      },
    }),
  ],
  // add your UnoCSS config here: https://unocss.dev/guide/config-file
})
