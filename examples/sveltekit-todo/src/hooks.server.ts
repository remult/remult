import { sequence } from '@sveltejs/kit/hooks';

import { api } from './api.server';
import authServer from './auth.server';

export const handle = sequence(authServer, api);
