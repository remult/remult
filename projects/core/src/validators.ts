import { Column } from "./column";
import { ColumnValidator } from './column-interfaces';
import { column } from "./remult3";

export class Validators {
    static required = Object.assign((col: column<string,any>, entity: any, message = 'Should not be empty') => {
        if (!col.value || col.value.trim().length == 0)
            col.error = message;
    }, {
        withMessage: (message: string) => {
            return (col: column<string,any>, entity: any) => Validators.required(col, entity, message)
        }
    });
    static unique = Object.assign(async (col: column<any,any>, entity: any, message = 'already exists') => {
        if (!col.rowHelper)
            throw "unique validation may only work on columns that are attached to an entity";


        if (col.rowHelper.isNew() || col.wasChanged()) {
            if (await col.rowHelper.repository.count(e => e[col.key].isEqualTo(col.value)))
                col.error = message;
        }
    }, {
        withMessage: (message: string) => {
            return (col: column<any,any>, entity) => Validators.unique(col, entity, message)
        }
    });
}








