import { describe, it, expect } from 'vitest'
import {
  Entity,
  Field,
  Fields,
  InMemoryDataProvider,
  Remult,
  Sort,
} from '../../core'
import type { ClassType } from '../../core/classType'
import { Status } from './testModel/models'

@Entity('mytest')
class myTest {
  @Fields.integer()
  id = 0

  @Field(() => Status)
  status = Status.open
}

describe('test sorts', () => {
  let remult = new Remult(new InMemoryDataProvider())
  function repo<T extends object>(entity: ClassType<T>) {
    return remult.repo(entity)
  }
  it('test sort', async () => {
    await repo(myTest).insert([
      { id: 1, status: Status.open },
      { id: 2, status: Status.hold },
      { id: 3, status: Status.closed },
    ])

    const orderBy = {
      status: 'desc' as const,
    }
    const find = await repo(myTest).find({
      orderBy,
    })
    const sort = Sort.translateOrderByToSort(repo(myTest).metadata, orderBy)
    const find2 = [...find]
    find2.sort((a, b) => a.id - b.id)
    find2.sort((a, b) => sort.compare(a, b))
    expect(find2.map((y) => y.id)).toMatchInlineSnapshot(`
      [
        2,
        3,
        1,
      ]
    `)
    expect(find.map((x) => x.id)).toEqual(find2.map((x) => x.id))
  })
})
