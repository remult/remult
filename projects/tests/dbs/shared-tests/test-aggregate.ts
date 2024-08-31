import { beforeAll, describe, expect, it } from 'vitest'
import { Entity } from '../../../../dist/remult/index.js'
import { Fields, type Repository } from '../../../core/index.js'
import type { DbTestProps } from './db-tests-props.js'
import type { DbTestOptions } from './db-tests.js'

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
  salary = 0
  @Fields.number()
  numberOfKids = 0
}

export function aggregateTest(
  { createEntity, getRemult, getDb }: DbTestProps,
  options?: DbTestOptions,
) {
  async function repo() {
    const r = await createEntity(TestEntityWithData)
    await r.insert([
      {
        id: '1',
        city: 'London',
        country: 'uk',
        salary: 5000,
        numberOfKids: 3,
      },
      {
        id: '2',
        city: 'London',
        country: 'uk',
        salary: 7000,
        numberOfKids: 2,
      },
      {
        id: '3',
        city: 'Manchester',
        country: 'uk',
        salary: 3000,
        numberOfKids: 5,
      },
      {
        id: '4',
        city: 'Manchester',
        country: 'uk',
        salary: 9000,
        numberOfKids: 1,
      },
      {
        id: '5',
        city: 'Paris',
        country: 'france',
        salary: 4000,
        numberOfKids: 4,
      },
      {
        id: '6',
        city: 'Paris',
        country: 'france',
        salary: 8000,
        numberOfKids: 6,
      },
      {
        id: '7',
        city: 'Berlin',
        country: 'germany',
        salary: 2000,
        numberOfKids: 7,
      },
      {
        id: '8',
        city: 'Berlin',
        country: 'germany',
        salary: 6000,
        numberOfKids: 9,
      },
      {
        id: '9',
        city: 'Hamburg',
        country: 'germany',
        salary: 1000,
        numberOfKids: 8,
      },
      {
        id: '10',
        city: 'Munich',
        country: 'germany',
        salary: 5000,
        numberOfKids: 2,
      },
      {
        id: '11',
        city: 'Rome',
        country: 'italy',
        salary: 3000,
        numberOfKids: 4,
      },
      {
        id: '12',
        city: 'Rome',
        country: 'italy',
        salary: 7000,
        numberOfKids: 1,
      },
      {
        id: '13',
        city: 'Milan',
        country: 'italy',
        salary: 4000,
        numberOfKids: 3,
      },
      {
        id: '14',
        city: 'Naples',
        country: 'italy',
        salary: 8000,
        numberOfKids: 5,
      },
      {
        id: '15',
        city: 'Madrid',
        country: 'spain',
        salary: 2000,
        numberOfKids: 6,
      },
      {
        id: '16',
        city: 'Barcelona',
        country: 'spain',
        salary: 6000,
        numberOfKids: 7,
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
      const results = await r.aggregate({
        groupBy: ['country'],
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
      const results = await r.aggregate({
        groupBy: ['country'],
        average: ['numberOfKids'],
        orderBy: {
          country: 'asc',
        },
      })

      expect(results.length).toBe(5)

      const uk = results.find((x) => x.country === 'uk')
      expect(uk?.numberOfKids.average).toBeCloseTo(2.75)

      const france = results.find((x) => x.country === 'france')
      expect(france?.numberOfKids.average).toBe(5)

      const germany = results.find((x) => x.country === 'germany')
      expect(germany?.numberOfKids.average).toBeCloseTo(6.5)
    })

    it('should group by city and country and order by country then city', async () => {
      const r = await repo()
      const results = await r.aggregate({
        groupBy: ['country', 'city'],
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
      const results = await r.aggregate({
        groupBy: ['country'],
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
        average: ['salary', 'numberOfKids'],
        where: {
          salary: { $gt: 1000 },
        },
      })

      expect(result).toBeDefined()
      expect(result.salary.sum).toBe(79000) // Sum of all salaries greater than 1000
      expect(result.numberOfKids.sum).toBe(65) // Sum of all numberOfKids for salaries greater than 1000
      expect(result.salary.average).toBeCloseTo(5266.666666) // Average salary for all salaries greater than 1000
      expect(result.numberOfKids.average).toBeCloseTo(4.3333333) // Average numberOfKids for all salaries greater than 1000
    })
  })
}
