import { InMemoryDataProvider } from '../data-providers/in-memory-database'
import { Status } from './testModel/models'
import { Remult } from '../context'
import {
  Categories as newCategories,
  CategoriesForTesting,
} from './remult-3-entities'
import { Repository } from '../remult3'
import { deleteAll } from '../shared-tests/deleteAll'

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
