import { FieldRef } from "./remult3";

export class Validators {
    static required = Object.assign((entity: any, col: FieldRef<any, string>, message = 'Should not be empty') => {
        if (!col.value || typeof (col.value) === "string" && col.value.trim().length == 0)
            col.error = message;
    }, {
        withMessage: (message: string) => {
            return (entity: any, col: FieldRef<any, string>) => Validators.required(entity, col, message)
        }
    });
    static unique = Object.assign(async (entity: any, col: FieldRef<any, any>, message = 'already exists') => {
        if (!col.entityRef)
            throw "unique validation may only work on columns that are attached to an entity";


        if (col.entityRef.isNew() || col.valueChanged()) {
            if (await col.entityRef.repository.count({ [col.metadata.key]: col.value }))
                col.error = message;
        }
    }, {
        withMessage: (message: string) => {
            return (entity, col: FieldRef<any, any>) => Validators.unique(entity, col, message)
        }
    });
}








