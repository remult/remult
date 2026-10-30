import { describe, it, expect, beforeEach } from 'vitest'
import {
  Entity,
  Fields,
  InMemoryDataProvider,
  Relations,
  Remult,
  type ClassType,
} from '../../../core'

// Regression for #1053: typed include results broke existing code in 3.4.0

let remult: Remult

@Entity('venues')
class Venue {
  @Fields.integer()
  id = 0
  @Fields.string()
  email = ''
}

@Entity('email-users')
class EmailUser {
  @Fields.string()
  email = ''
  @Relations.toMany(() => Venue, { field: 'email' })
  venues?: Venue[]

  static findOne(email: string) {
    return remult
      .repo(EmailUser)
      .findOne({ where: { email }, include: { venues: true } })
  }
}

async function selectFrom<T>(type: ClassType<T>, key: keyof T) {
  const rows = await remult.repo(type).find({
    // @ts-expect-error - generic where
    where: { [key]: { $ne: null } },
  })
  const row = await remult
    .repo(type)
    // @ts-expect-error - generic id
    .findId(rows[0][key])
  return [rows.map((r) => r[key]), row![key]]
}

describe('include result stays assignable to the entity type', () => {
  beforeEach(() => {
    remult = new Remult(new InMemoryDataProvider())
  })
  it('find with include result can be reassigned from insert', async () => {
    let user = await EmailUser.findOne('a@b.com')
    if (!user) user = await remult.repo(EmailUser).insert({ email: 'a@b.com' })
    expect(user.email).toBe('a@b.com')
  })
  it('generic helper with failing overload still indexes by keyof T', async () => {
    await remult.repo(Venue).insert({ id: 1, email: 'a@b.com' })
    const [values, value] = await selectFrom(Venue, 'id')
    expect(values).toEqual([1])
    expect(value).toBe(1)
  })
})
