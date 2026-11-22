import { beforeEach, describe, expect, it } from 'vitest'
import {
  Entity,
  Field,
  FieldType,
  Fields,
  InMemoryDataProvider,
  Remult,
  type EntityFilter,
} from '../../core'

const pad = (n: number) => String(n).padStart(4, '0')

// Zero-padded so the JSON sorts like the versions, with 1.10 after 1.9
@FieldType<Version>({
  valueConverter: {
    toJson: (x) => `${pad(x.major)}.${pad(x.minor)}`,
    fromJson: (x: string) => {
      const [major, minor] = x.split('.').map(Number)
      return new Version(major, minor)
    },
  },
})
class Version {
  constructor(
    readonly major: number,
    readonly minor: number,
  ) {}
}

class Label {
  constructor(readonly text: string) {}
}

declare module 'remult' {
  interface ComparableTypes {
    version: Version
  }
}

@Entity('releases')
class Release {
  @Fields.integer()
  id = 0
  @Field(() => Version)
  version = new Version(0, 0)
  @Field(() => Label)
  label = new Label('')
}

describe('ComparableTypes', () => {
  let remult = new Remult()
  beforeEach(() => {
    remult = new Remult(new InMemoryDataProvider())
  })

  it('types comparison operators on an added type only', () => {
    const filter: EntityFilter<Release> = {
      version: { $gt: new Version(1, 9), $lte: new Version(2, 0) },
    }
    const notComparable: EntityFilter<Release> = {
      // @ts-expect-error Label isn't in ComparableTypes
      label: { $gt: new Label('a') },
    }
    expect(filter).toBeDefined()
    expect(notComparable).toBeDefined()
  })

  it('compares an added type by its toJson in memory', async () => {
    const repo = remult.repo(Release)
    await repo.insert([
      { id: 1, version: new Version(1, 9) },
      { id: 2, version: new Version(1, 10) },
      { id: 3, version: new Version(2, 0) },
    ])
    const newer = await repo.find({
      where: { version: { $gt: new Version(1, 9) } },
      orderBy: { id: 'asc' },
    })
    expect(newer.map((r) => r.id)).toEqual([2, 3])
  })
})
