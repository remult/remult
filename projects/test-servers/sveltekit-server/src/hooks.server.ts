import { sequence } from '@sveltejs/kit/hooks'

import { handleRemult } from './hooks/handleRemult'

export const handle = sequence(handleRemult)
