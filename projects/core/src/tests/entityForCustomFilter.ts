import { SqlDatabase } from '../data-providers/sql-database';
import { Entity, EntityBase, Field, EntityFilter, Fields } from '../remult3';
import { Filter } from '../filter/filter-interfaces';
import { ArrayEntityDataProvider } from '../data-providers/array-entity-data-provider';
import { getDbNameProvider } from '../filter/filter-consumer-bridge-to-sql-request';



@Entity('entityForCustomFilter', { allowApiCrud: true })
export class entityForCustomFilter extends EntityBase {
    @Fields.Integer()
    id: number;
    static filter = Filter.createCustom<entityForCustomFilter, {
        oneAndThree?: boolean;
        dbOneOrThree?: boolean;
        two?: boolean;
    }>(async (remult, c) => {

        let r: EntityFilter<entityForCustomFilter>[] = [];
        if (c.oneAndThree)
            r.push({ id: [1, 3] });
        if (c.two)
            r.push({ id: 2 });
        if (c.dbOneOrThree) {
            let meta = remult.repo(entityForCustomFilter).metadata;
            const e = await getDbNameProvider(meta);
            r.push(
                {
                    $and: [
                        SqlDatabase.customFilter(async (x) => x.sql = e.nameOf(meta.fields.id) + ' in (' + x.addParameterAndReturnSqlToken(1) + "," + x.addParameterAndReturnSqlToken(3) + ")"),
                        ArrayEntityDataProvider.customFilter(x => x.id == 1 || x.id == 3)
                    ]
                }
            );
        }
        return { $and: r };
    });
    static oneAndThree = Filter.createCustom<entityForCustomFilter>(() => ({ id: [1, 3] }));
    static testNumericValue = Filter.createCustom<entityForCustomFilter, number>((r, val) => ({ id: val }));
    static testObjectValue = Filter.createCustom<entityForCustomFilter, { val: number; }>((r, val) => ({ id: val.val }));
}

@Entity('entityForCustomFilter1', { allowApiCrud: true })
export class entityForCustomFilter1 extends entityForCustomFilter {

}