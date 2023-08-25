import { expect, it, describe } from 'vitest'
import { config } from 'dotenv'
import { Entity, Fields, dbNamesOf, describeClass, remult } from '../core'
import {
  PostgresSchemaBuilder,
  createPostgresDataProvider,
} from '../core/postgres'
config()
if (process.env['DATABASE_URL'])
  describe('Test postgres schema builder', () => {
    it('test creates table', async () => {
      const db = await createPostgresDataProvider() //connection string is in a .env file placed in the `tests` folder with key `DATABASE_URL`
      remult.dataProvider = db
      const table = class {
        id = ''
        name = ''
      }
      describeClass(table, Entity('test1'), {
        id: Fields.string(),
        name: Fields.string(),
      })
      const repo = remult.repo(table)
      const t = await dbNamesOf(repo)
      await db.execute(`drop table if exists ${t.$entityName}`)
      var sb = new PostgresSchemaBuilder(db)
      await sb.createIfNotExist(repo.metadata)
      expect(await repo.count()).toBe(0)
    })
  })
  else {
    it("stam",()=>expect(1+1).toBe(2))
  }
