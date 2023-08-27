import { InMemoryDataProvider } from '../..'
import { Remult } from '../context'
import { Entity, EntityBase, Fields } from '../remult3'
import { describe, it, expect } from 'vitest'
@Entity<parent>('parent', {
  saving: async (self) => {
    await new Promise((r) =>
      setTimeout(() => {
        r({})
      }, 10),
    )
    self.myField += ',parent'
  },
})
export class parent extends EntityBase {
  @Fields.integer()
  id: number = 0
  @Fields.string()
  myField: string = ''
  @Fields.string<parent>({ saving: (self) => (self.autoSavedField = 'auto') })
  autoSavedField: string = ''
}
@Entity<child>('child', {
  saving: async (self) => {
    await new Promise((r) =>
      setTimeout(() => {
        r({})
      }, 10),
    )
    self.myField += 'child'
  },
})
export class child extends parent {}
@Entity<child2>('child2', {})
export class child2 extends parent {}

it('saving works well ', async () => {
  let remult = new Remult(new InMemoryDataProvider())
  let x = await remult.repo(child).create().save()
  expect(x.myField).toBe('child,parent')
  expect(x.autoSavedField).toBe('auto')
})
it('saving works well when child doesnt have saving', async () => {
  let remult = new Remult(new InMemoryDataProvider())
  let x = await remult.repo(child2).create().save()
  expect(x.myField).toBe(',parent')
  expect(x.autoSavedField).toBe('auto')
})
it('test saving of delete', async () => {
  let remult = new Remult(new InMemoryDataProvider())
  let x = await remult.repo(child).create().save()
  await x.delete()
  let done = false
  try {
    await x.save()
    done = true
  } catch (err) {}
  expect(done).toBe(false)
})

@Entity<anError>('error', {
  saving: async (self) => {
    if (!self.isNew() && self.name == '2') {
      self.name = '3'
      await self.save()
    }
  },
})
export class anError extends EntityBase {
  @Fields.integer()
  id: number = 0
  @Fields.string()
  name = ''
}
it('test error on save within saving', async () => {
  let remult = new Remult(new InMemoryDataProvider())
  let x = await remult.repo(anError).create({ id: 1, name: '1' }).save()
  x.name = '2'
  let done = false
  try {
    await x.save()
    done = true
  } catch (err) {}
  expect(done).toBe(false)
})
