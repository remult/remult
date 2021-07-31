import { FieldMetadata } from '../';
import { DateOnlyValueConverter } from '../valueConverters';

export function postgresColumnSyntax(x: FieldMetadata, dbName: string) {
    let result = dbName;
    if (x.valueType == Number) {
        if (!x.valueConverter.fieldTypeInDb)
            result += " numeric" + (x.allowNull ? "" : " default 0 not null");

        else
            result += " " + x.valueConverter.fieldTypeInDb + (x.allowNull ? "" : " default 0 not null");
    }
    else if (x.valueType == Date) {
        if (!x.valueConverter.fieldTypeInDb)
            if (x.valueConverter == DateOnlyValueConverter)
                result += " date";
            else
                result += " timestamp";
        else
            result += " " + x.valueConverter.fieldTypeInDb;
    }
    else if (x.valueType == Boolean)
        result += " boolean" + (x.allowNull ? "" : " default false not null");

    else if (x.valueConverter.fieldTypeInDb) {
        result += " " + x.valueConverter.fieldTypeInDb;
        if (!x.allowNull && x.valueConverter.fieldTypeInDb == 'integer') {
            result += " default 0 not null";
        }
    }
    else
        result += " varchar" + (x.allowNull ? "" : " default '' not null");
    return result;
}
