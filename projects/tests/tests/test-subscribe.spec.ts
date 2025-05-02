import { beforeEach, describe, expect, it, onTestFailed } from 'vitest'
import { InMemoryDataProvider } from '../../core/'
import { Entity, EntityBase, Field, Fields } from '../../core'
import { Remult } from '../../core/src/context'
import { Validators } from '../../core/src/validators'

describe('test subscribe', () => {
  it('basics', async () => {
    let repo = new Remult(new InMemoryDataProvider()).repo(myEntity)
    for (const del of await repo.find()) {
      await del.delete()
    }
    let state = {
      title: '',
      wasChanged: false,
      isNew: false,
      error: '',
      titleError: '',
    }
    let i = repo.create()
    let r = i._.subscribe(() => {
      state.title = i.title
      state.wasChanged = i._.wasChanged()
      state.isNew = i._.isNew()
      state.error = i._.error!
      state.titleError = i.$.title.error!
    })
    i.title = 'a'
    expect(state.title).toBe('a')
    i.title = 'ab'
    expect(state.title).toBe('ab')
    expect(state.wasChanged).toBe(true)
    expect(state.isNew).toBe(true)
    let x = i.save()
    expect(i._.isLoading).toBe(true)
    await x
    expect(i._.isLoading).toBe(false)
    expect(state.title).toBe('ab')
    expect(state.wasChanged).toBe(false)
    expect(state.isNew).toBe(false)
    i.$.title.error = 'error'
    expect(state.titleError).toBe('error')
    i._.error = 'error'
    expect(state.error).toBe('error')
  })
  it('observed', async () => {
    let repo = new Remult(new InMemoryDataProvider()).repo(myEntity)
    for (const del of await repo.find()) {
      await del.delete()
    }
    let i = repo.create()
    let observed = false
    i._.subscribe({
      reportChanged: () => {},
      reportObserved: () => (observed = true),
    })

    function testObserved(what: () => void) {
      observed = false
      what()
      expect(observed).toBe(true)
    }
    testObserved(() => {
      i.title.toString()
    })
    testObserved(() => {
      i.$.title.valueChanged()
    })
    testObserved(() => {
      i.isNew()
    })
    testObserved(() => {
      i._.wasChanged()
    })
  })
  it('refInitWorks', async () => {
    let repo = new Remult(new InMemoryDataProvider()).repo(myEntity)
    for (const del of await repo.find()) {
      await del.delete()
    }
    entityRefInitCount = 0
    let remultInitCount = 0
    Remult.entityRefInit = () => remultInitCount++

    let i = repo.create({ title: 'a' })
    expect(entityRefInitCount).toBe(1)
    expect(remultInitCount).toBe(1)
    await i.save()
    expect(entityRefInitCount).toBe(1)
    expect(remultInitCount).toBe(1)
    Remult.entityRefInit = undefined
  })
  it('test subscribe with many to one', async () => {
    const remult = new Remult(new InMemoryDataProvider())
    const repo = remult.repo(entityWithManyToOne)
    for (const del of await repo.find()) {
      await del.delete()
    }
    let refRowA = await remult.repo(myEntity).create({ title: 'a' }).save()
    let refRowB = await remult.repo(myEntity).create({ title: 'b' }).save()
    let reflect = { title: '' }
    let r = repo.create()
    let sub = r._.subscribe(() => (reflect.title = r.entity?.title!))
    r.entity = refRowA
    expect(reflect.title).toBe('a')
    sub()
    r.entity = refRowB
    expect(reflect.title).toBe('a')
  })
  it('test subscribe to field with many to one', async () => {
    const remult = new Remult(new InMemoryDataProvider())
    const repo = remult.repo(entityWithManyToOne)
    for (const del of await repo.find()) {
      await del.delete()
    }
    let refRowA = await remult.repo(myEntity).create({ title: 'a' }).save()
    let refRowB = await remult.repo(myEntity).create({ title: 'b' }).save()
    let reflect = { title: '' }
    let r = repo.create()

    let sub = r.$.entity!.subscribe(() => (reflect.title = r.entity?.title!))
    r.entity = refRowA
    expect(reflect.title).toBe('a')
    sub()
    r.entity = refRowB
    expect(reflect.title).toBe('a')
  })
})
describe('test remult', () => {
  let remult: Remult
  let observed = false
  let changed = false
  beforeEach(() => {
    remult = new Remult()
    remult.user = { id: '1', name: '123', roles: ['admin'] }
    observed = false
    changed = false
    remult.subscribeAuth({
      reportObserved: () => (observed = true),
      reportChanged: () => (changed = true),
    })
  })
  it('test user', () => {
    expect(observed).toBe(false)
    expect(changed).toBe(false)
    remult.user = { id: '2', name: '123', roles: ['admin'] }
    expect(observed).toBe(false)
    expect(changed).toBe(true)
  })
  it('test user', () => {
    var z = remult.user!.id
    expect(observed).toBe(true)
  })
  it('test authenticated', () => {
    expect(remult.authenticated()).toBe(true)
    expect(observed).toBe(true)
  })
  it('test isAllowed', () => {
    expect(remult.isAllowed('admin')).toBe(true)
    expect(observed).toBe(true)
  })
  it('test undefined', () => {
    remult.user = undefined
    expect(observed).toBe(false)
    expect(changed).toBe(true)
    expect(remult.authenticated()).toBe(false)
    expect(observed).toBe(true)
  })
})
let entityRefInitCount = 0
@Entity('theEntity', {
  allowApiCrud: true,
  entityRefInit: () => entityRefInitCount++,
})
class myEntity extends EntityBase {
  @Fields.string({
    validate: Validators.required,
  })
  title: string = ''
}

@Entity('entityWithManyToOne', {
  allowApiCrud: true,
})
class entityWithManyToOne extends EntityBase {
  @Fields.number()
  id: number = 0
  @Field(() => myEntity)
  entity?: myEntity
}
