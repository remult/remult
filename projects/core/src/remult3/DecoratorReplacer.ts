import { EntityOptions } from "../entity";
import { ClassType } from "../../classType";
import { Remult } from "../context";
import { Entity } from "./RepositoryImplementation";
import { OmitEB } from "./remult3";
import { BackendMethod, BackendMethodOptions } from "../server-action";




export function BuildEntity<entityType>(c: ClassType<entityType>, key: string, fields: BuildEntityFields<entityType>, ...options: (EntityOptions<entityType> | ((options: EntityOptions<entityType>, remult: Remult) => void))[]) {
    Entity(key, ...options)(c);
    for (const fieldKey in fields) {
        if (Object.prototype.hasOwnProperty.call(fields, fieldKey)) {
            const element = fields[fieldKey];
            const prop = Object.getOwnPropertyDescriptor(c.prototype, fieldKey);
            element(c.prototype, fieldKey, prop);
            if (prop)
                Object.defineProperty(c.prototype, fieldKey, prop);
        }
    }
}


export declare type BuildEntityFields<entityType> = {
    [Properties in keyof Partial<OmitEB<entityType>>]: any
}

export function DescribeStaticBackendMethod<T>(cls: T, methodName: keyof T, options: BackendMethodOptions<any>, paramTypes?: any[]) {
    const prop = Object.getOwnPropertyDescriptor(cls, methodName);
    if (paramTypes)
        Reflect.defineMetadata("design:paramtypes", paramTypes, cls, methodName as string)
    BackendMethod(options)(cls, methodName as string, prop);
    Object.defineProperty(cls, methodName, prop);
}
export function DescribeBackendMethod<T>(cls: ClassType<T>, methodName: keyof T, options: BackendMethodOptions<any>, paramTypes?: any[]) {
    const prop = Object.getOwnPropertyDescriptor(cls.prototype, methodName);
    if (!prop)
        throw Error(`Couldn't find method ${methodName as string} on class ${cls.constructor.name}`)
    if (paramTypes)
        Reflect.defineMetadata("design:paramtypes", paramTypes, cls.prototype, methodName as string)
    BackendMethod(options)(cls.prototype, methodName as string, prop);
    Object.defineProperty(cls.prototype, methodName, prop);
}