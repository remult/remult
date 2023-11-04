import { Remult } from '../../core/src/context'
import { InMemoryDataProvider } from '../../core/src/data-providers/in-memory-database'
import type { Repository } from '../../core'
import { deleteAll } from '../dbs/shared-tests/deleteAll'
import type { CategoriesForTesting } from './remult-3-entities'
import { Categories as newCategories } from './remult-3-entities'
import type { Status } from './testModel/models'

export async function createData(
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
): Promise<[Repository<CategoriesForTesting>, Remult]> {
  let remult = new Remult()
  remult.dataProvider = new InMemoryDataProvider()
  if (!entity) entity = newCategories
  let rep = await deleteAll(remult.repo(entity))
  if (doInsert)
    await doInsert(async (id, name, description, status) => {
      let c = rep.create()
      c.id = id
      c.categoryName = name
      c.description = description
      if (status) c.status = status
      await rep.save(c)
    })
  return [rep, remult]
}
