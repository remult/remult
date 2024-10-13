import { beforeAll, describe, expect, it, test } from 'vitest'
import { Entity } from '../../../core/index.js'
import {
  Field,
  Fields,
  Relations,
  ValueListFieldType,
  type Repository,
} from '../../../core/index.js'
import type { DbTestProps } from './db-tests-props.js'
import type { DbTestOptions } from './db-tests.js'
import { GroupByForApiKey } from '../../../core/src/remult3/remult3.js'

@ValueListFieldType()
class Status {
  static open = new Status('open', 'Open')
  static closed = new Status('closed', 'Closed')
  constructor(
    public id: string,
    public caption: string,
  ) {}
}

@Entity('TestAggregateEntity', {
  allowApiCrud: true,
})
class TestEntityWithData {
  @Fields.integer()
  id = ''
  @Fields.string()
  city = ''
  @Fields.string()
  country = ''
  @Fields.number()
  salary: number | null = 0
  @Fields.number()
  numberOfKids: number | undefined = 0
  @Field(() => Status)
  status = Status.open
  @Relations.toOne(() => Category)
  category?: Category
}

@Entity('Category', {
  allowApiCrud: true,
})
export class Category {
  @Fields.number()
  id = 0
  @Fields.string()
  name = ''
}

export function aggregateTest(
  { createEntity, getRemult, getDb }: DbTestProps,
  options?: DbTestOptions,
) {
  async function repo() {
    const cat = await createEntity(Category)
    const c = await cat.insert([
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
    ])
    const r = await createEntity(TestEntityWithData)
    await r.insert([
      {
        id: '1',
        city: 'London',
        country: 'uk',
        salary: 5000,
        numberOfKids: 3,
        category: c[0],
      },
      {
        id: '2',
        city: 'London',
        country: 'uk',
        salary: 7000,
        numberOfKids: 2,
        category: c[1],
      },
      {
        id: '3',
        city: 'Manchester',
        country: 'uk',
        salary: 3000,
        numberOfKids: 5,
        category: c[0],
      },
      {
        id: '4',
        city: 'Manchester',
        country: 'uk',
        salary: 9000,
        numberOfKids: 1,
        category: c[1],
      },
      {
        id: '5',
        city: 'Paris',
        country: 'france',
        salary: 4000,
        numberOfKids: 4,
        category: c[1],
      },
      {
        id: '6',
        city: 'Paris',
        country: 'france',
        salary: 8000,
        numberOfKids: 6,
        category: c[1],
      },
      {
        id: '7',
        city: 'Berlin',
        country: 'germany',
        salary: 2000,
        numberOfKids: 7,
        category: c[1],
      },
      {
        id: '8',
        city: 'Berlin',
        country: 'germany',
        salary: 6000,
        numberOfKids: 9,
        category: c[1],
      },
      {
        id: '9',
        city: 'Hamburg',
        country: 'germany',
        salary: 1000,
        numberOfKids: 8,
        category: c[1],
      },
      {
        id: '10',
        city: 'Munich',
        country: 'germany',
        salary: 5000,
        numberOfKids: 2,
        category: c[1],
      },
      {
        id: '11',
        city: 'Rome',
        country: 'italy',
        salary: 3000,
        numberOfKids: 4,
        category: c[1],
      },
      {
        id: '12',
        city: 'Rome',
        country: 'italy',
        salary: 7000,
        numberOfKids: 1,
        category: c[1],
      },
      {
        id: '13',
        city: 'Milan',
        country: 'italy',
        salary: 4000,
        numberOfKids: 3,
        category: c[1],
      },
      {
        id: '14',
        city: 'Naples',
        country: 'italy',
        salary: 8000,
        numberOfKids: 5,
        category: c[1],
      },
      {
        id: '15',
        city: 'Madrid',
        country: 'spain',
        salary: 2000,
        numberOfKids: 6,
        category: c[1],
      },
      {
        id: '16',
        city: 'Barcelona',
        country: 'spain',
        salary: 6000,
        numberOfKids: 7,
        category: c[1],
      },
    ])
    return r
  }
  describe('General Aggregate Test', () => {
    it('basic test', async () => {
      const r = await repo()
      expect(await r.count()).toBe(16)
      expect((await r.aggregate({})).$count).toBe(16)
    })

    it('should sum salaries by country', async () => {
      const r = await repo()
      const results = await r.groupBy({
        group: ['country'],
        sum: ['salary'],
        orderBy: {
          country: 'asc',
        },
      })

      expect(results.length).toBe(5)

      const uk = results.find((x) => x.country === 'uk')
      expect(uk?.salary.sum).toBe(24000)

      const france = results.find((x) => x.country === 'france')
      expect(france?.salary.sum).toBe(12000)

      const germany = results.find((x) => x.country === 'germany')
      expect(germany?.salary.sum).toBe(14000)
    })

    it('should calculate average number of kids by country', async () => {
      const r = await repo()
      const results = await r.groupBy({
        group: ['country'],
        avg: ['numberOfKids'],
        orderBy: {
          country: 'asc',
        },
      })

      expect(results.length).toBe(5)

      const uk = results.find((x) => x.country === 'uk')
      expect(uk?.numberOfKids.avg).toBeCloseTo(2.75)

      const france = results.find((x) => x.country === 'france')
      expect(france?.numberOfKids.avg).toBe(5)

      const germany = results.find((x) => x.country === 'germany')
      expect(germany?.numberOfKids.avg).toBeCloseTo(6.5)
    })

    it('should group by city and country and order by country then city', async () => {
      const r = await repo()
      const results = await r.groupBy({
        group: ['country', 'city'],
        sum: ['salary'],
        orderBy: {
          country: 'asc',
          city: 'asc',
        },
      })

      expect(results.length).toBe(11)
      expect(results[0].country).toBe('france')
      expect(results[0].city).toBe('Paris')
      expect(results[0].salary.sum).toBe(12000)

      expect(results[10].country).toBe('uk')
      expect(results[10].city).toBe('Manchester')
      expect(results[10].salary.sum).toBe(12000)
    })

    it('should return correct count for each group', async () => {
      const r = await repo()
      const results = await r.groupBy({
        group: ['country'],
        sum: ['salary'],
        orderBy: {
          country: 'asc',
        },
      })

      expect(results.length).toBe(5)

      const uk = results.find((x) => x.country === 'uk')
      expect(uk?.$count).toBe(4)

      const france = results.find((x) => x.country === 'france')
      expect(france?.$count).toBe(2)
    })

    it('should return a single result when no groupBy is provided', async () => {
      const r = await repo()
      const result = await r.aggregate({
        sum: ['salary', 'numberOfKids'],
        avg: ['salary', 'numberOfKids'],
        where: {
          salary: { $gt: 1000! },
        },
      })

      expect(result).toBeDefined()
      expect(result.salary.sum).toBe(79000) // Sum of all salaries greater than 1000
      expect(result.numberOfKids.sum).toBe(65) // Sum of all numberOfKids for salaries greater than 1000
      expect(result.salary.avg).toBeCloseTo(5266.666666) // Average salary for all salaries greater than 1000
      expect(result.numberOfKids.avg).toBeCloseTo(4.3333333) // Average numberOfKids for all salaries greater than 1000
    })
    test('Query with Aggregate', async () => {
      const r = await repo()
      const result = await r
        .query({
          where: {
            salary: { $gt: 1000! },
          },
          aggregate: {
            sum: ['salary', 'numberOfKids'],
            avg: ['salary', 'numberOfKids'],
          },
          include: {
            category: true,
          },
        })
        .paginator()
      expect(result.items.length).toBe(15)
      expect(result.aggregates.$count).toBe(15)
      expect(result.aggregates.salary.sum).toBe(79000) // Sum of all salaries greater than 1000
      expect(result.aggregates.numberOfKids.sum).toBe(65) // Sum of all numberOfKids for salaries greater than 1000
      expect(result.aggregates.salary.avg).toBeCloseTo(5266.666666) // Average salary for all salaries greater than 1000
      expect(result.aggregates.numberOfKids.avg).toBeCloseTo(4.3333333) // Average numberOfKids for all salaries greater than 1000
      expect(result.items[0].category?.name).toBe('a')
    })
    it('field cant be used both for group by and sum', async () => {
      const r = await repo()
      await expect(async () => {
        await r.groupBy({
          group: ['salary'],
          sum: ['salary'],
        })
      }).rejects.toThrowErrorMatchingInlineSnapshot(
        `[Error: field "salary" cannot be used both in an aggregate and in group by]`,
      )
    })
    it('cant use invalid field', async () => {
      const r = await repo()
      await expect(async () => {
        await r.groupBy({
          //@ts-expect-error I want to test an invalid field
          group: ['salary1'],
        })
      }).rejects.toThrowErrorMatchingInlineSnapshot(
        `[Error: key "salary1" not found in entity]`,
      )
    })
    it('should group by country and city, and order by $count in descending order', async () => {
      const r = await repo()
      const results = await r.groupBy({
        group: ['country', 'city'],
        sum: ['salary'],
        orderBy: {
          $count: 'desc',
        },
      })

      expect(results).toBeDefined()
      expect(results.length).toBeGreaterThan(0)

      // Check if the results are sorted by $count in descending order
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].$count).toBeGreaterThanOrEqual(results[i].$count)
      }
    })
    it('should calculate min and max salary grouped by city', async () => {
      const r = await repo()

      const results = await r.groupBy({
        group: ['city'],
        min: ['salary'],
        max: ['salary'],
        orderBy: {
          city: 'asc',
        },
      })
      expect(results).toMatchInlineSnapshot(`
        [
          {
            "$count": 1,
            "city": "Barcelona",
            "salary": {
              "max": 6000,
              "min": 6000,
            },
          },
          {
            "$count": 2,
            "city": "Berlin",
            "salary": {
              "max": 6000,
              "min": 2000,
            },
          },
          {
            "$count": 1,
            "city": "Hamburg",
            "salary": {
              "max": 1000,
              "min": 1000,
            },
          },
          {
            "$count": 2,
            "city": "London",
            "salary": {
              "max": 7000,
              "min": 5000,
            },
          },
          {
            "$count": 1,
            "city": "Madrid",
            "salary": {
              "max": 2000,
              "min": 2000,
            },
          },
          {
            "$count": 2,
            "city": "Manchester",
            "salary": {
              "max": 9000,
              "min": 3000,
            },
          },
          {
            "$count": 1,
            "city": "Milan",
            "salary": {
              "max": 4000,
              "min": 4000,
            },
          },
          {
            "$count": 1,
            "city": "Munich",
            "salary": {
              "max": 5000,
              "min": 5000,
            },
          },
          {
            "$count": 1,
            "city": "Naples",
            "salary": {
              "max": 8000,
              "min": 8000,
            },
          },
          {
            "$count": 2,
            "city": "Paris",
            "salary": {
              "max": 8000,
              "min": 4000,
            },
          },
          {
            "$count": 2,
            "city": "Rome",
            "salary": {
              "max": 7000,
              "min": 3000,
            },
          },
        ]
      `)
    })

    it('should calculate distinct count of cities grouped by country', async () => {
      const r = await repo()

      const results = await r.groupBy({
        group: ['country'],
        distinctCount: ['city'],
        orderBy: {
          country: 'asc',
        },
      })

      expect(results).toMatchInlineSnapshot(`
        [
          {
            "$count": 2,
            "city": {
              "distinctCount": 1,
            },
            "country": "france",
          },
          {
            "$count": 4,
            "city": {
              "distinctCount": 3,
            },
            "country": "germany",
          },
          {
            "$count": 4,
            "city": {
              "distinctCount": 3,
            },
            "country": "italy",
          },
          {
            "$count": 2,
            "city": {
              "distinctCount": 2,
            },
            "country": "spain",
          },
          {
            "$count": 4,
            "city": {
              "distinctCount": 2,
            },
            "country": "uk",
          },
        ]
      `)
    })

    it('should order results by distinct count of cities', async () => {
      const r = await repo()

      const results = await r.groupBy({
        group: ['country'],
        distinctCount: ['city'],
        where: { country: ['germany', 'uk', 'france'] },
        orderBy: {
          city: {
            distinctCount: 'desc',
          },
        },
      })

      expect(results).toMatchInlineSnapshot(`
        [
          {
            "$count": 4,
            "city": {
              "distinctCount": 3,
            },
            "country": "germany",
          },
          {
            "$count": 4,
            "city": {
              "distinctCount": 2,
            },
            "country": "uk",
          },
          {
            "$count": 2,
            "city": {
              "distinctCount": 1,
            },
            "country": "france",
          },
        ]
      `)
    })
    it('test value list type', async () => {
      const r = await repo()
      expect(
        await r.groupBy({
          group: ['status'],
          orderBy: {
            status: 'asc',
          },
        }),
      ).toMatchInlineSnapshot(`
        [
          {
            "$count": 16,
            "status": Status {
              "caption": "Open",
              "id": "open",
            },
          },
        ]
      `)
    })
    it('test relation to one', async () => {
      const r = await repo()
      expect(
        await r.groupBy({
          group: ['category'],
          orderBy: {
            category: 'asc',
          },
        }),
      ).toMatchInlineSnapshot(`
          [
            {
              "$count": 2,
              "category": Category {
                "id": 1,
                "name": "a",
              },
            },
            {
              "$count": 14,
              "category": Category {
                "id": 2,
                "name": "b",
              },
            },
          ]
        `)
    })
    it('test relation to one for api', async () => {
      const r = await repo()
      expect(
        await r.groupBy({
          group: ['category'],
          orderBy: {
            category: 'asc',
          },
          //@ts-expect-error this is an internal flag
          [GroupByForApiKey]: true,
        }),
      ).toMatchInlineSnapshot(`
          [
            {
              "$count": 2,
              "category": 1,
            },
            {
              "$count": 14,
              "category": 2,
            },
          ]
        `)
    })
  })
}
