#!/usr/bin/env -S deno run -A --watch=static/,routes/

import "https://deno.land/x/dotenv/load.ts";
import dev from "$fresh/dev.ts";

await dev(import.meta.url, "./main.ts");
