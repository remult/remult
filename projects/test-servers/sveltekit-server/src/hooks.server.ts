import type { Handle } from '@sveltejs/kit'
import { _api } from './routes/api/[...remult]/+server'

// api routes run their own request cycle: an initRequest crash there is the 400
// the shared server tests expect, through the hook it would surface as a 500
export const handle: Handle = ({ event, resolve }) =>
  event.url.pathname.startsWith('/api/')
    ? resolve(event)
    : _api({ event, resolve })
