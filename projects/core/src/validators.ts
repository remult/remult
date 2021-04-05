import { Column } from "./column";
import { ColumnValidator } from './column-interfaces';

export class Validators {
    static required = Object.assign((col: Column<string>, message = 'Should not be empty') => {
        if (!col.value || col.value.trim().length == 0)
            col.validationError = message;
    }, {
        withMessage: (message: string) => {
            return (col: Column<string>) => Validators.required(col, message)
        }
    });
    static unique = Object.assign(async (col: Column<any>, message = 'already exists') => {
        if (!col.defs.entity)
            throw "unique validation may only work on columns that are attached to an entity";


        if (col.defs.entity.isNew() || col.wasChanged()) {
            if (await col.defs.entity.defs.provider.count(e => e.columns.find(col).isEqualTo(col.value)))
                col.validationError = message;
        }
    }, {
        withMessage: (message: string) => {
            return (col: Column<any>) => Validators.unique(col, message)
        }
    });
}








