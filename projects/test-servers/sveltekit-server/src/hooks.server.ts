import { sequence } from '@sveltejs/kit/hooks';

import { api } from './api.server';

export const handle = sequence(api);
