---
llm: "Node's built-in SQLite via NodeSqliteDataProvider wrapped in SqlDatabase on the dataProvider option."
---

### Node SQLite

Node.js 22.5.0 and newer include a synchronous SQLite implementation in the
built-in `node:sqlite` module. No database driver package is required.

Configure the `dataProvider` in your `api.ts` or server file:

```ts
import express from 'express'
import { DatabaseSync } from 'node:sqlite'
import { SqlDatabase } from 'remult'
import { remultApi } from 'remult/remult-express'
import { NodeSqliteDataProvider } from 'remult/remult-node-sqlite'

const app = express()

app.use(
  remultApi({
    dataProvider: new SqlDatabase(
      new NodeSqliteDataProvider(new DatabaseSync('./mydb.sqlite')),
    ),
  }),
)
```

`DatabaseSync` serializes access within the Node.js process. A file-backed
SQLite database should normally be used by a single application instance unless
the deployment architecture provides its own coordination.
