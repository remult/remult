import { getHtml } from './get-remult-admin-html.js'
import type { AdminDisplayOptions } from './remult-admin.js'

export default function remultAdminHtml(options: AdminDisplayOptions) {
  const { head, rootPath, requireAuthToken, disableLiveQuery } = options
  return getHtml()
    .replace('<!--PLACE_HERE_HEAD-->', sanitizeHead(head))
    .replace(
      '<!--PLACE_HERE_BODY-->',
      `<script>
  window.optionsFromServer = ${JSON.stringify({
    rootPath,
    requireAuthToken,
    disableLiveQuery,
  })}

function sanitizeHead(head: string | undefined) {
  return (head ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
</script>`,
    )
}
