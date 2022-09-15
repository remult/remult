import { EntityOptions } from "../entity";
import { ClassType } from "../../classType";
import { Remult } from "../context";
import { Entity } from "./RepositoryImplementation";
import { OmitEB } from "./remult3";
import { BackendMethod, BackendMethodOptions, Controller } from "../server-action";




export function describeEntity<entityType>(c: entityType, key: string, fields: MembersAndStaticMembers<entityType>, ...options: (EntityOptions<entityType> | ((options: EntityOptions<entityType>, remult: Remult) => void))[]) {
    Entity(key, ...options)(c);
    readDecoratorsDefinitions<entityType>(fields, c);
}
function readDecoratorsDefinitions<entityType>(fields: MembersAndStaticMembers<entityType>, c: entityType) {
    for (const fieldKey in fields) {
        if (Object.prototype.hasOwnProperty.call(fields, fieldKey)) {
            const element = fields[fieldKey];
            if (fieldKey === 'static') {
                for (const staticFieldKey in element) {
                    const staticElement = element[staticFieldKey];
                    const prop = Object.getOwnPropertyDescriptor(c, staticFieldKey);
                    staticElement(c, staticFieldKey, prop);
                    if (prop)
                        Object.defineProperty(c, staticFieldKey, prop);
                }
            }
            else {
                const prop = Object.getOwnPropertyDescriptor((c as any).prototype, fieldKey);
                element((c as any).prototype, fieldKey, prop);
                if (prop)
                    Object.defineProperty((c as any).prototype, fieldKey, prop);
            }
        }
    }
}

export function describeController<controllerType>(c: controllerType, key: string, fields: MembersAndStaticMembers<controllerType>) {
    Controller(key)(c);
    readDecoratorsDefinitions<controllerType>(fields, c);
}
type Decorator<T = any> = (a: T, b: string, c?: any) => void;
type Decorators<T> = T extends new (...args: any[]) => infer R ? { [K in keyof OmitEB<R>]?: Decorator } : never;
type StaticDecorators<T> = { [K in keyof T]?: Decorator };

type MembersAndStaticMembers<T> = Decorators<T> & { static?: StaticDecorators<T> };



export function describeStaticBackendMethod<T>(cls: T, methodName: keyof T, options: BackendMethodOptions<any>, paramTypes?: any[]) {
    const prop = Object.getOwnPropertyDescriptor(cls, methodName);
    if (paramTypes)
        Reflect.defineMetadata("design:paramtypes", paramTypes, cls, methodName as string)
    BackendMethod(options)(cls, methodName as string, prop);
    Object.defineProperty(cls, methodName, prop);
}
export function describeBackendMethod<T>(cls: ClassType<T>, methodName: keyof T, options: BackendMethodOptions<any>, paramTypes?: any[]) {
    const prop = Object.getOwnPropertyDescriptor(cls.prototype, methodName);
    if (!prop)
        throw Error(`Couldn't find method ${methodName as string} on class ${cls.constructor.name}`)
    if (paramTypes)
        Reflect.defineMetadata("design:paramtypes", paramTypes, cls.prototype, methodName as string)
    BackendMethod(options)(cls.prototype, methodName as string, prop);
    Object.defineProperty(cls.prototype, methodName, prop);
}

export function describeClass<classType>(classType: classType, classDecorator: Decorator<classType>, members: Decorators<classType>, staticMembers: StaticDecorators<classType>) {
    classDecorator(classType, undefined);
    readDecoratorsDefinitions<classType>(members, classType);
}