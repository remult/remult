import { ClassType } from '../../classType'
import { Remult } from '../context'
import { DataProvider } from '../data-interfaces'
import { InMemoryDataProvider } from '../data-providers/in-memory-database'
import { remult } from '../remult-proxy'
import { Repository } from '../remult3'
import { Categories, CategoriesForTesting } from '../tests/remult-3-entities'
import { Status } from '../tests/testModel/models'
import { describe, it, expect } from 'vitest'

export function itWithFocus(
  key: string,
  what: () => Promise<void>,
  focus = false,
) {
  if (focus) {
    fit(key, what)
  } else it(key, what)
}
export function testAll(
  key: string,
  what: dbTestWhatSignature,
  focus = false,
  options?: {
    exclude?: string[]
  },
) {
  function runTest(m: dbTestMethodSignature) {
    return !options?.exclude?.includes(m.key)
  }
  for (const test of databasesTesters) {
    if (runTest(test)) test(key, what, focus)
  }
  loadedTests.push((x) => {
    if (runTest(x)) x(key, what, focus)
  })
}

const databasesTesters = [] as dbTestMethodSignature[]
const loadedTests = [] as ((tested: dbTestMethodSignature) => void)[]
export function addDatabaseToTest(tester: dbTestMethodSignature, key?: string) {
  tester.key = key
  for (const test of loadedTests) {
    test(tester)
  }
  databasesTesters.push(tester)
  return tester
}

export function testInMemory(
  key: string,
  what: dbTestWhatSignature,
  focus = false,
) {
  itWithFocus(
    key + ' - in memory',
    async () => {
      let db = new InMemoryDataProvider()
      let remult = new Remult(db)
      await what({ db, remult, createEntity: async (x) => remult.repo(x) })
    },
    focus,
  )
}
export const TestDbs = {
  restDataProvider: 'restDataProvider',
  webSql:'webSql',
  mongo: 'mongo',
  mongoNoTrans: 'mongoNoTrans',
  inMemory: 'in memory',
}

addDatabaseToTest(testInMemory, TestDbs.inMemory)

export declare type dbTestWhatSignature = (db: {
  db: DataProvider
  remult: Remult
  createEntity<entityType>(
    entity: ClassType<entityType>,
  ): Promise<Repository<entityType>>
}) => Promise<void>
export declare type dbTestMethodSignature = ((
  key: string,
  what: dbTestWhatSignature,
  focus: boolean,
) => void) & { key?: string }

export async function testAllDbs<T extends CategoriesForTesting>(
  key: string,
  doTest: (helper: {
    remult: Remult
    createData: (
      doInsert?: (
        insert: (
          id: number,
          name: string,
          description?: string,
          status?: Status,
        ) => Promise<void>,
      ) => Promise<void>,
      entity?: {
        new (): CategoriesForTesting
      },
    ) => Promise<Repository<T>>
    insertFourRows: () => Promise<Repository<T>>
  }) => Promise<any>,
  focus = false,
) {
  testAll(
    key,
    async ({ remult, createEntity }) => {
      let createData = async (doInsert, entity?) => {
        if (!entity) entity = Categories
        let rep = (await createEntity(entity)) as Repository<T>
        if (doInsert)
          await doInsert(async (id, name, description, status) => {
            let c = rep.create()
            c.id = id
            c.categoryName = name
            c.description = description
            if (status) c.status = status
            await rep.save(c)
          })
        return rep
      }

      await doTest({
        remult,
        createData,
        insertFourRows: async () => {
          return createData(async (i) => {
            await i(1, 'noam', 'x')
            await i(4, 'yael', 'x')
            await i(2, 'yoni', 'y')
            await i(3, 'maayan', 'y')
          })
        },
      })
    },
    focus,
  )
}
