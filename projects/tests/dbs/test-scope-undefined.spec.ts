import { describe, expect, it } from 'vitest'
import { Entity } from '../../core/src/remult3/entity.js'
import { Fields, Relations } from '../../core/src/remult3/Fields.js'
import { remult } from '../../core/src/remult-proxy.js'
import { InMemoryDataProvider } from '../../core/src/data-providers/in-memory-database.js'
import { TestApiDataProvider } from '../../core/server/index.js'
import { repo } from '../../core/index.js'

@Entity('a', {
  allowApiCrud: true,
})
export class aEntity {
  @Fields.cuid({
    allowApiUpdate: false,
    required: true,
    caption: 'Database ID',
  })
  id!: string
}
@Entity('b', {
  allowApiCrud: true,
})
export class bEntity {
  @Fields.cuid()
  id!: string
}

@Entity('c', {
  allowApiCrud: true,
})
export class cEntity {
  @Fields.cuid()
  id!: string

  @Relations.toOne(() => aEntity)
  a?: aEntity

  @Relations.toOne(() => bEntity)
  b?: bEntity
}

describe('test scope undefined error', () => {
  it('', async () => {
    remult.dataProvider = new InMemoryDataProvider()

    remult.dataProvider = TestApiDataProvider({
      dataProvider: remult.dataProvider,
    })
    const c = await repo(cEntity).insert({})
    expect(c.id).toBeDefined()

    let reload: cEntity[]
    console.log('before find')
    reload = await repo(cEntity).find({
      include: { a: true, b: true },
    })
    console.log('done with test')
  })
})
