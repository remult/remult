import { FieldRef } from "./remult3";

export class Validators {
    static required = Object.assign((entity: any, col: FieldRef<string, any>, message = 'Should not be empty') => {
        if (!col.value || col.value.trim().length == 0)
            col.error = message;
    }, {
        withMessage: (message: string) => {
            return (entity: any, col: FieldRef<string, any>) => Validators.required(entity, col, message)
        }
    });
    static unique = Object.assign(async (entity: any, col: FieldRef<any, any>, message = 'already exists') => {
        if (!col.entityRef)
            throw "unique validation may only work on columns that are attached to an entity";


        if (col.entityRef.isNew() || col.wasChanged()) {
            if (await col.entityRef.repository.count(e => e[col.metadata.key].isEqualTo(col.value)))
                col.error = message;
        }
    }, {
        withMessage: (message: string) => {
            return (entity, col: FieldRef<any, any>) => Validators.unique(entity, col, message)
        }
    });
}








