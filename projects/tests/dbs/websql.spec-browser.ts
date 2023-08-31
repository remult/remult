import { Remult } from '../../core/src/context'
import { SqlDatabase } from '../../core/src/data-providers/sql-database'
import { WebSqlDataProvider } from '../../core/src/data-providers/web-sql-data-provider'

import { beforeAll, beforeEach, describe, expect, it, vitest } from 'vitest'
import { allDbTests } from './shared-tests'
import { entityWithValidations } from './shared-tests/entityWithValidations'
import type { ClassType } from '../../core/classType'
import type { Repository } from '../../core'
import { dbNamesOf } from '../../core'
import { Categories } from '../tests/remult-3-entities'

describe('websql', () => {
  var db: SqlDatabase
  let remult: Remult

  beforeAll(async () => {})
  beforeEach(async () => {
    let webSql = new WebSqlDataProvider('test')
    db = new SqlDatabase(webSql)
    for (const r of await (
      await db.execute("select name from sqlite_master where type='table'")
    ).rows) {
      switch (r.name) {
        case '__WebKitDatabaseInfoTable__':
          break
        case 'sqlite_sequence':
          break
        default:
          await db.execute('drop table if exists ' + r.name)
      }
    }
  })
  async function createEntity<T>(entity: ClassType<T>) {
    return remult.repo(entity)
  }

  beforeEach(() => {
    remult = new Remult(db)
  })
  allDbTests(
    {
      getDb() {
        return db
      },
      getRemult() {
        return remult
      },
      createEntity,
    },
    {
      excludeTransactions: true,
      excludeLiveQuery: true,
    },
  )
  it('work with native sql', async () => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity)
    const sql = SqlDatabase.getDb(remult)
    const r = await sql.execute(
      'select count(*) as c from ' + repo.metadata.options.dbName!,
    )
    expect(r.rows[0].c).toBe(4)
  })
  it('work with native sql2', async () => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity)
    const sql = WebSqlDataProvider.getDb(remult)
    await new Promise((res) => {
      sql.transaction((y) => {
        y.executeSql(
          'select count(*) as c from ' + repo.metadata.options.dbName!,
          undefined,
          (_, r) => {
            expect(r.rows[0].c).toBe(4)
            res({})
          },
        )
      })
    })
  })
  it('test getEntityDbNames', async () => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity)
    const e = await dbNamesOf(repo)
    expect(`select ${e.myId}, ${e.name} from ${e}`).toBe(
      'select myId, name from entityWithValidations',
    )
  })
  it('test work with filter', async () => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity)
    const e = await dbNamesOf(repo)
    expect(
      `select ${e.myId}, ${
        e.name
      } from ${e} where ${await SqlDatabase.filterToRaw(repo, {
        myId: [1, 3],
      })}`,
    ).toBe('select myId, name from entityWithValidations where myId in (1,3)')
  })
  it('test work with filter', async () => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity)
    const command = SqlDatabase.getDb(remult).createCommand()
    const e = await dbNamesOf(repo)
    expect(
      `select ${e.myId}, ${
        e.name
      } from ${e} where ${await SqlDatabase.filterToRaw(
        repo,
        {
          myId: [1, 3],
        },
        command,
      )}`,
    ).toBe(
      'select myId, name from entityWithValidations where myId in (~1~,~2~)',
    )
  })
  it('test basics', async () => {
    const cat = await createEntity(Categories)
    expect(await cat.count()).toBe(0)
    let c = remult.repo(Categories).create()
    c.id = 1
    c.categoryName = 'noam'
    await c._.save()
    expect(await cat.count()).toBe(1)
    let cats = await cat.find()
    expect(cats.length).toBe(1)
    expect(cats[0].id).toBe(1)
    expect(cats[0].categoryName).toBe('noam')
  })

  it('test transactions', async () => {
    const cat = await createEntity(Categories)
    let sql = new WebSqlDataProvider('test')
    const prev = SqlDatabase.LogToConsole
    SqlDatabase.LogToConsole = true
    try {
      let db: SqlDatabase = new SqlDatabase({
        createCommand: () => sql.createCommand(),
        entityIsUsedForTheFirstTime: (e) => sql.entityIsUsedForTheFirstTime(e),
        getLimitSqlSyntax: (a, b) => sql.getLimitSqlSyntax(a, b),
        transaction: (what) => what(sql),
      })

      await db.transaction(async (dp) => {
        const repo = new Remult(dp).repo(Categories)
        expect(await repo.count({ categoryName: 'a' })).toBe(0)
        let ok = false
        try {
          await dp.transaction(async () => {})
          ok = true
        } catch {}
        expect(ok).toBe(false)
      })
    } finally {
      SqlDatabase.LogToConsole = false
    }
  })
  it('query after transaction should fail', async () => {
    let sql = new WebSqlDataProvider('test')
    let db: SqlDatabase = new SqlDatabase({
      createCommand: () => sql.createCommand(),
      entityIsUsedForTheFirstTime: (e) => sql.entityIsUsedForTheFirstTime(e),
      getLimitSqlSyntax: (a, b) => sql.getLimitSqlSyntax(a, b),
      transaction: (what) => what(sql),
    })
    let repo: Repository<Categories>
    await db.transaction(async (dp) => {
      repo = new Remult(dp).repo(Categories)
    })
    let ok = false
    try {
      await repo.count({ categoryName: 'a' })
      ok = true
    } catch {}
    expect(ok).toBe(false)
  })
  it('LogToConsole oneLiner', async () => {
    const cat = await createEntity(Categories)

    SqlDatabase.LogToConsole = 'oneLiner'

    const info = vitest.spyOn(console, 'info')
    await cat.insert([{ categoryName: 'a', id: 1 }])

    expect(info).toHaveBeenCalledWith(expect.stringMatching('⚪'))

    SqlDatabase.LogToConsole = false
  })
})
