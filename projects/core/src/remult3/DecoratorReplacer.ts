import { ClassType } from "../../classType";
import { EntityOptions } from "../entity";
import { OmitEB, InferMemberType, InferredType, TypedDecorator } from "./remult3";
import { Entity, Field } from "./RepositoryImplementation";

type Decorator<T = any> = (a: T, b: string, c?: any) => void;
type Decorators<T> = T extends new (...args: any[]) => infer R ? { [K in keyof OmitEB<R>]?: Decorator } : never;
type StaticDecorators<T> = { [K in keyof T]?: Decorator };

export function describeClass<classType>(classType: classType, classDecorator: ((x: any) => any) | undefined, members?: Decorators<classType> | undefined, staticMembers?: StaticDecorators<classType>) {
    if (classDecorator)
        classDecorator(classType);
    for (const fieldKey in members) {
        if (Object.prototype.hasOwnProperty.call(members, fieldKey)) {
            let element: any = members[fieldKey];
            const prop = Object.getOwnPropertyDescriptor((classType as any).prototype, fieldKey);
            if (typeof element !== "function") {
                const t = createClass(element);
                Field(() => t)((classType as any).prototype, fieldKey);
            } else if (element.prototype) {
                Field(() => element)((classType as any).prototype, fieldKey);
            } else
                element((classType as any).prototype, fieldKey, prop);
            if (prop)
                Object.defineProperty((classType as any).prototype, fieldKey, prop);
        }
    }

    for (const staticFieldKey in staticMembers) {
        const staticElement = staticMembers[staticFieldKey];
        const prop = Object.getOwnPropertyDescriptor(classType, staticFieldKey);
        staticElement(classType, staticFieldKey, prop);
        if (prop)
            Object.defineProperty(classType, staticFieldKey, prop);
    }
}







export function createEntity<T>(key: string, members: T, options?: EntityOptions<InferredType<T>>): { new(...args): InferredType<T> } {
    const r = class { };
    describeClass(r, Entity(key, options), members);
    //@ts-ignore
    return r;
}
export function createClass<T>(members: T): ClassType<InferredType<T>> {
    const r = class { };
    describeClass(r, undefined, members);
    //@ts-ignore
    return r;
}