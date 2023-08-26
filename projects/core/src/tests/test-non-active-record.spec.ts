import { Remult } from '../context'
import { ErrorInfo } from '../data-interfaces'
import { InMemoryDataProvider } from '../data-providers/in-memory-database'
import { Entity, Fields } from '../remult3'
import { Validators } from '../validators'
import { describe, it, expect,beforeEach,afterEach,beforeAll } from 'vitest'

@Entity('nonActiveRecord', {})
class taskNonActiveRecord {
  @Fields.uuid()
  id!: string
  @Fields.string({
    validate: Validators.required,
  })
  title = ''
  @Fields.boolean()
  completed = false
}
describe('test non active record', () => {
  let remult = new Remult(new InMemoryDataProvider())
  let repo = remult.repo(taskNonActiveRecord)
  beforeEach(() => {
    remult = new Remult(new InMemoryDataProvider())
    repo = remult.repo(taskNonActiveRecord)
  })
  it('test save of new row validation', async () => {
    let item = { ...new taskNonActiveRecord() }
    let ok = true
    try {
      await repo.save(item)
      ok = false
    } catch (err: any) {
      expect(
        (err as ErrorInfo<taskNonActiveRecord>)?.modelState?.title,
      ).toContain('empty')
      expect(item.id).toBeUndefined()
    }
    expect(ok).toBe(true)
  })
  it('test save of existing row validation', async () => {
    let item = { ...(await repo.insert({ title: 'test' })), title: '' }
    let ok = true
    try {
      await repo.save(item)
      ok = false
    } catch (err: any) {
      expect(
        (err as ErrorInfo<taskNonActiveRecord>)?.modelState?.title,
      ).toContain('empty')
    }
    expect(ok).toBe(true)
  })
  it("test save doesn't return non row elements", async () => {
    let item: taskNonActiveRecord & { changed?: boolean } = {
      ...(await repo.insert({ title: 'test' })),
      title: 'test1',
      changed: true,
    }
    item = await repo.save(item)
    expect(item.changed).toBe(undefined)
  })
  it('delete works with non active record', async () => {
    let item = await repo.save({ title: 'a' })
    await repo.insert({ title: 'b' })
    expect(repo.getEntityRef(item).isNew()).toBe(false)
    await repo.delete({ ...item })
    expect(await repo.count()).toBe(1)
  })
  it("test save doesn't return the messed up object", async () => {
    var x: taskNonActiveRecord & { changed?: boolean } = {
      ...new taskNonActiveRecord(),
      title: 'a',
      changed: true,
    }
    x = await repo.insert(x)
    expect(x.changed).toBe(undefined)
    expect(x.id.length > 1).toBe(true)
  })
})
