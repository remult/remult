import { SqlDatabase } from '../data-providers/sql-database'
import { Entity, EntityBase, Field, EntityFilter, Fields } from '../remult3'
import { Filter } from '../filter/filter-interfaces'
import { ArrayEntityDataProvider } from '../data-providers/array-entity-data-provider'
import { dbNamesOf } from '../filter/filter-consumer-bridge-to-sql-request'

@Entity('entityForrawFilter', { allowApiCrud: true })
export class entityForrawFilter extends EntityBase {
  @Fields.integer()
  id: number
  static filter = Filter.createCustom<
    entityForrawFilter,
    {
      oneAndThree?: boolean
      dbOneOrThree?: boolean
      two?: boolean
    }
  >(async (c, remult) => {
    let r: EntityFilter<entityForrawFilter>[] = []
    if (c.oneAndThree) r.push({ id: [1, 3] })
    if (c.two) r.push({ id: 2 })
    if (c.dbOneOrThree) {
      const e = await dbNamesOf(remult.repo(entityForrawFilter))
      r.push({
        $and: [
          SqlDatabase.rawFilter(
            async (x) =>
              (x.sql =
                e.id +
                ' in (' +
                x.addParameterAndReturnSqlToken(1) +
                ',' +
                x.addParameterAndReturnSqlToken(3) +
                ')'),
          ),
          ArrayEntityDataProvider.rawFilter((x) => x.id == 1 || x.id == 3),
        ],
      })
    }
    return { $and: r }
  })
  static oneAndThree = Filter.createCustom<entityForrawFilter>(() => ({
    id: [1, 3],
  }))
  static testNumericValue = Filter.createCustom<entityForrawFilter, number>(
    (val) => ({ id: val }),
  )
  static testObjectValue = Filter.createCustom<
    entityForrawFilter,
    { val: number }
  >((val) => ({ id: val.val }))
}

@Entity('entityForrawFilter1', { allowApiCrud: true })
export class entityForrawFilter1 extends entityForrawFilter {}
