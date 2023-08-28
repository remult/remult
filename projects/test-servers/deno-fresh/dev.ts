#!/usr/bin/env -S deno run -A --watch=static/,routes/

import dev from '$fresh/dev.ts'
import 'https://deno.land/x/dotenv/load.ts'

await dev(import.meta.url, './main.ts')
