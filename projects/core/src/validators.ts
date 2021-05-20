import { EntityColumn } from "./remult3";

export class Validators {
    static required = Object.assign((entity: any, col: EntityColumn<string, any>, message = 'Should not be empty') => {
        if (!col.value || col.value.trim().length == 0)
            col.error = message;
    }, {
        withMessage: (message: string) => {
            return (entity: any, col: EntityColumn<string, any>) => Validators.required(entity, col, message)
        }
    });
    static unique = Object.assign(async (entity: any, col: EntityColumn<any, any>, message = 'already exists') => {
        if (!col.rowHelper)
            throw "unique validation may only work on columns that are attached to an entity";


        if (col.rowHelper.isNew() || col.wasChanged()) {
            if (await col.rowHelper.repository.count(e => e[col.key].isEqualTo(col.value)))
                col.error = message;
        }
    }, {
        withMessage: (message: string) => {
            return (entity, col: EntityColumn<any, any>) => Validators.unique(entity, col, message)
        }
    });
}








