import { WebSqlDataProvider } from '../data-providers/web-sql-data-provider'
import { Remult } from '../context'
import { SqlDatabase } from '../data-providers/sql-database'
import { Categories } from './remult-3-entities'
import {
  Entity,
  EntityFilter,
  Fields,
  OmitEB,
  Repository,
  RepositoryImplementation,
} from '../remult3'
import { testWebSqlImpl } from './frontend-database-tests-setup.spec-browser'
import { entityWithValidations } from '../shared-tests/entityWithValidations'
import {
  EntityDbNames,
  FilterConsumerBridgeToSqlRequest,
  dbNamesOf,
} from '../filter/filter-consumer-bridge-to-sql-request'
import { SqlCommand, SqlResult } from '../sql-command'
import { Filter } from '../filter/filter-interfaces'
import { describe, it, expect } from 'vitest'

describe('test sql database', () => {
  let db = new SqlDatabase(new WebSqlDataProvider('test'))
  let remult = new Remult()
  remult.dataProvider = db
  async function deleteAll() {
    for (const c of await remult.repo(Categories).find()) {
      await c._.delete()
    }
  }
  it('test basics', async () => {
    await deleteAll()
    expect(await remult.repo(Categories).count()).toBe(0)
    let c = remult.repo(Categories).create()
    c.id = 1
    c.categoryName = 'noam'
    await c._.save()
    expect(await remult.repo(Categories).count()).toBe(1)
    let cats = await remult.repo(Categories).find()
    expect(cats.length).toBe(1)
    expect(cats[0].id).toBe(1)
    expect(cats[0].categoryName).toBe('noam')
  })

  it('test transactions', async () => {
    await deleteAll()
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
    await deleteAll()
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
  it('test column error', async () => {
    await deleteAll()
    await remult.repo(Categories).insert([{ categoryName: 'a', id: 1 }])
    try {
      await remult.repo(testErrorInFromDb).find()
    } catch (err) {
      expect(err.message).toContain('categoryName')
    }
  })
  it('LogToConsole true', async () => {
    await deleteAll()

    SqlDatabase.LogToConsole = true

    console.info = jasmine.createSpy('log')
    await remult.repo(Categories).insert([{ categoryName: 'a', id: 1 }])

    expect(console.info).toHaveBeenCalledWith(
      jasmine.objectContaining({
        query:
          'insert into Categories (CategoryID, categoryName) values (~1~, ~2~) returning CategoryID, categoryName, description, status',
        arguments: { '~1~': 1, '~2~': 'a' },
      }),
    )

    SqlDatabase.LogToConsole = false
  })

  it('LogToConsole oneLiner', async () => {
    await deleteAll()

    SqlDatabase.LogToConsole = 'oneLiner'

    console.info = jasmine.createSpy('log')
    await remult.repo(Categories).insert([{ categoryName: 'a', id: 1 }])

    expect(console.info).toHaveBeenCalledWith(jasmine.stringMatching('⚪'))

    SqlDatabase.LogToConsole = false
  })

  it('LogToConsole fn', async () => {
    await deleteAll()

    SqlDatabase.LogToConsole = (
      duration: number,
      query: string,
      args: Record<string, any>,
    ) => {}

    SqlDatabase.LogToConsole = jasmine.createSpy('log')
    await remult.repo(Categories).insert([{ categoryName: 'a', id: 1 }])

    expect(SqlDatabase.LogToConsole).toHaveBeenCalledWith(
      jasmine.anything(),
      'insert into Categories (CategoryID, categoryName) values (~1~, ~2~) returning CategoryID, categoryName, description, status',
      jasmine.objectContaining({ '~1~': 1, '~2~': 'a' }),
    )

    SqlDatabase.LogToConsole = false
  })
})

@Entity('Categories')
class testErrorInFromDb {
  @Fields.integer({ dbName: 'CategoryID' })
  id = 0
  @Fields.string({
    valueConverter: {
      fromDb: (x) => {
        throw 'error'
      },
    },
  })
  categoryName = ''
}

testWebSqlImpl(
  'work with native sql',
  async ({ remult, createEntity }) => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity)
    const sql = SqlDatabase.getDb(remult)
    const r = await sql.execute(
      'select count(*) as c from ' + repo.metadata.options.dbName!,
    )
    expect(r.rows[0].c).toBe(4)
  },
  false,
)
testWebSqlImpl(
  'work with native sql2',
  async ({ remult, createEntity }) => {
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
  },
  false,
)
testWebSqlImpl(
  'test getEntityDbNames',
  async ({ remult, createEntity }) => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity)
    const e = await dbNamesOf(repo)
    expect(`select ${e.myId}, ${e.name} from ${e}`).toBe(
      'select myId, name from entityWithValidations',
    )
  },
  false,
)
testWebSqlImpl(
  'test work with filter',
  async ({ remult, createEntity }) => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity)
    const e = await dbNamesOf(repo)
    expect(
      `select ${e.myId}, ${
        e.name
      } from ${e} where ${await SqlDatabase.filterToRaw(repo, {
        myId: [1, 3],
      })}`,
    ).toBe('select myId, name from entityWithValidations where myId in (1,3)')
  },
  false,
)
testWebSqlImpl(
  'test work with filter',
  async ({ remult, createEntity }) => {
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
  },
  false,
)
