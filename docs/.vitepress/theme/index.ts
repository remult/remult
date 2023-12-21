import DefaultTheme from 'vitepress/theme'
import MyLayout from './MyLayout.vue'
import './custom.css'
import { enhanceAppWithTabs } from 'vitepress-plugin-tabs/client'

export default {
  ...DefaultTheme,
  // override the Layout with a wrapper component that
  // injects the slots
  Layout: MyLayout,
  enhanceApp({ app }) {
    enhanceAppWithTabs(app)
  },
}
