import { Entity, EntityBase, Field, FieldType, Fields } from '../remult3'
import { testAll } from './db-tests-setup'
import { describe, it, expect } from 'vitest'

@FieldType<GroupsValue>({
  valueConverter: {
    toJson: (x) => (x ? x.value : ''),
    fromJson: (x) => new GroupsValue(x),
    displayValue: (x) => x.value,
  },
})
export class GroupsValue {
  hasAny() {
    return this.value != ''
  }

  constructor(private readonly value: string) {}
  evilGet() {
    return this.value
  }
  listGroups() {
    if (!this.value) return []
    return this.value.split(',')
  }
  removeGroup(group: string) {
    let groups = this.value.split(',').map((x) => x.trim())
    let index = groups.indexOf(group)
    let result = ''
    if (index >= 0) {
      groups.splice(index, 1)
      result = groups.join(', ')
    }
    return new GroupsValue(result)
  }
  addGroup(group: string) {
    let r = this.value
    if (r) r += ', '
    else r = ''
    r += group
    return new GroupsValue(r)
  }
  selected(group: string) {
    if (!this.value) return false
    return this.value.indexOf(group) >= 0
  }
}

@Entity('testGroups', { allowApiCrud: true })
class testGroups extends EntityBase {
  @Fields.integer()
  id: number = 0
  @Field(() => GroupsValue)
  g: GroupsValue
}

testAll('test save and load', async ({ createEntity }) => {
  let re = await createEntity(testGroups)
  await re.create({ id: 1 }).save()
  let x = await re.findFirst()
  expect(x.g.evilGet()).toBe('')
  x.g = x.g.addGroup('xx')
  expect(x.$.g.valueChanged()).toBe(true)
  await x.save()
  expect(x.g.evilGet()).toBe('xx')
})
testAll('test2 save and load', async ({ createEntity }) => {
  let re = await createEntity(testGroups)
  await re.create({ id: 1, g: new GroupsValue(undefined) }).save()
  let x = await re.findFirst()
  expect(x.g.evilGet()).toBe('')
})
