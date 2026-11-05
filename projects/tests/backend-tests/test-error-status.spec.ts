import express from 'express'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import axios from 'axios'
import {
  BackendMethod,
  Entity,
  Fields,
  InMemoryDataProvider,
  Remult,
  RestDataProvider,
  remult,
  withRemult,
} from '../../core'
import { remultApi } from '../../core/remult-express.js'
import { actionInfo } from '../../core/internals.js'
import { RemultAsyncLocalStorage } from '../../core/src/context.js'

@Entity('errorStatusItems', { allowApiCrud: true })
class Item {
  @Fields.autoIncrement()
  id = 0
  @Fields.string()
  title = ''
  @BackendMethod({ allowed: true })
  async touch() {
    return this.title
  }
}

describe('http status of unexpected errors', () => {
  const port = 3015
  const dataProvider = new InMemoryDataProvider()
  const api = remultApi({ entities: [Item], dataProvider })
  let close: () => Promise<void>

  beforeAll(async () => {
    const app = express()
    app.use(api)
    await new Promise<void>((res) => {
      const connection = app.listen(port, () => res())
      close = () => new Promise((res) => connection.close(() => res()))
    })
  })
  afterAll(async () => {
    RemultAsyncLocalStorage.disable()
    await close()
  })

  const asClient = (what: () => Promise<void>) =>
    withRemult(async () => {
      remult.dataProvider = new RestDataProvider(() => remult.apiClient)
      remult.apiClient.httpClient = axios
      remult.apiClient.url = `http://127.0.0.1:${port}/api`
      actionInfo.runningOnServer = false
      await what()
    })

  it('a failing database is a 500', () =>
    asClient(async () => {
      const original = dataProvider.getEntityDataProvider.bind(dataProvider)
      dataProvider.getEntityDataProvider = (entity) => {
        const result = original(entity)
        result.find = async () => {
          throw new Error('Connection terminated unexpectedly')
        }
        return result
      }
      try {
        await expect(remult.repo(Item).find()).rejects.toMatchObject({
          message: 'Connection terminated unexpectedly',
          httpStatusCode: 500,
        })
      } finally {
        dataProvider.getEntityDataProvider = original
      }
    }))

  it('a backend method on a row that no longer exists is a 400', () =>
    asClient(async () => {
      const item = await remult.repo(Item).insert({ title: 'a' })
      await new Remult(dataProvider)
        .repo(Item)
        .deleteMany({ where: { id: item.id } })
      await expect(item.touch()).rejects.toMatchObject({
        message: 'not found or too many matches',
        httpStatusCode: 400,
      })
    }))
})
