import { getHtml } from './get-remult-admin-html.js'
import type { AdminDisplayOptions } from './remult-admin.js'

export default function remultAdminHtml(options: AdminDisplayOptions) {
  const { head, rootPath, requireAuthToken, disableLiveQuery } = options
  const body = `<script>
  window.optionsFromServer = ${JSON.stringify({
    rootPath,
    requireAuthToken,
    disableLiveQuery,
  })}
</script>`
  // replacer functions: a string replacement would expand `$&` and friends
  return getHtml()
    .replace('<!--PLACE_HERE_HEAD-->', () => head)
    .replace('<!--PLACE_HERE_BODY-->', () => body)
}
