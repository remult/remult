import express from 'express'
import * as Knex from 'knex'
import { remultApi } from '../../core/remult-express.js'
import { describe, expect, it } from 'vitest'
import {
  BackendMethod,
  Entity,
  Fields,
  InMemoryDataProvider,
  remult,
  repo,
  RestDataProvider,
  withRemult,
} from '../../core'
import { KnexDataProvider } from '../../core/remult-knex/index.js'
import { RemultAsyncLocalStorage } from '../../core/src/context.js'
import axios from 'axios'
import { actionInfo } from '../../core/internals.js'

@Entity('rows_in_venue_db', { allowApiCrud: true })
class RowInVenueDb {
  @Fields.autoIncrement()
  id = 0
  @Fields.string()
  name = ''
}

class VenueController {
  @BackendMethod({ allowed: true })
  static async insertTwoThenFail() {
    await repo(RowInVenueDb).insert({ name: 'first' })
    await repo(RowInVenueDb).insert({ name: 'second' })
    throw new Error('simulated sql failure')
  }
  @BackendMethod({ allowed: true, transactional: false })
  static async insertTwoThenFailNotTransactional() {
    await repo(RowInVenueDb).insert({ name: 'first' })
    await repo(RowInVenueDb).insert({ name: 'second' })
    throw new Error('simulated sql failure')
  }
}

async function scenario(
  port: number,
  useWithRemultMiddleware: boolean,
  run: (api: ReturnType<typeof remultApi>) => Promise<void>,
) {
  let destroy: () => Promise<void> = async () => {}
  const venueKnex = Knex.default({
    client: 'better-sqlite3',
    connection: { filename: ':memory:' },
    useNullAsDefault: true,
  })
  try {
    const venueDb = new KnexDataProvider(venueKnex)
    await venueDb.ensureSchema([repo(RowInVenueDb).metadata])

    const api = remultApi({
      entities: [RowInVenueDb],
      controllers: [VenueController],
      dataProvider: new InMemoryDataProvider(),
      initRequest: async () => {
        remult.dataProvider = venueDb
      },
    })

    const app = express()
    if (useWithRemultMiddleware) app.use(api.withRemult)
    app.use(api)
    await new Promise<void>((res) => {
      const connection = app.listen(port, () => res())
      destroy = async () => new Promise((res) => connection.close(() => res()))
    })

    await withRemult(async () => {
      remult.dataProvider = new RestDataProvider(() => remult.apiClient)
      remult.apiClient.httpClient = axios
      remult.apiClient.url = `http://127.0.0.1:${port}/api`
      actionInfo.runningOnServer = false
      await run(api)
    })

    return await withRemult((r) => r.repo(RowInVenueDb).count(), {
      dataProvider: venueDb,
    })
  } finally {
    RemultAsyncLocalStorage.disable()
    actionInfo.runningOnServer = true
    await destroy()
    await venueKnex.destroy()
  }
}

describe.sequential('backend method transaction with initRequest provider', () => {
  it('rolls back inserts made on a provider assigned in initRequest', async () => {
    const rows = await scenario(3011, false, async () => {
      await expect(VenueController.insertTwoThenFail()).rejects.toThrow()
    })
    expect(rows).toBe(0)
  })
  it('rolls back also when api.withRemult middleware runs initRequest', async () => {
    const rows = await scenario(3012, true, async () => {
      await expect(VenueController.insertTwoThenFail()).rejects.toThrow()
    })
    expect(rows).toBe(0)
  })
  it('transactional:false keeps the partial inserts', async () => {
    const rows = await scenario(3013, false, async () => {
      await expect(
        VenueController.insertTwoThenFailNotTransactional(),
      ).rejects.toThrow()
    })
    expect(rows).toBe(2)
  })
  it('calling the backend method server-side (isBackend) runs without a transaction', async () => {
    const rows = await scenario(3014, false, async (api) => {
      actionInfo.runningOnServer = true
      const req = { headers: {} } as any
      await expect(
        api.withRemultAsync(req, () => VenueController.insertTwoThenFail()),
      ).rejects.toThrow()
    })
    expect(rows).toBe(2)
  })
})
