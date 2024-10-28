# Nest.js

### Bootstrap Remult in the Nest.js back-end

1. Create a `main.ts` file in the `src/` folder with the following code:

```ts title="src/main.ts"
// src/main.ts

import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { remultExpress } from 'remult/remult-express'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.use(remultExpress()) // Integrate Remult as middleware

  await app.listen(3002) // Start server on port 3002
}
bootstrap()
```

2. Add a simple `AppModule` in `src/app.module.ts`:

```ts title="src/app.module.ts"
// src/app.module.ts

import { Module } from '@nestjs/common'

@Module({})
export class AppModule {}
```

### Run the Nest.js server

Run the server with:

```sh
npm run start
```

Your Nest.js app with Remult is now up and running on port `3002`.
