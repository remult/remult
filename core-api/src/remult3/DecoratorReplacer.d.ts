import { ClassType } from "../../classType";
import { EntityOptions } from "../entity";
import { OmitEB, InferredType } from "./remult3";
declare type Decorator<T = any> = (a: T, b: string, c?: any) => void;
declare type Decorators<T> = T extends new (...args: any[]) => infer R ? {
    [K in keyof OmitEB<R>]?: Decorator;
} : never;
declare type StaticDecorators<T> = {
    [K in keyof T]?: Decorator;
};
export declare function describeClass<classType>(classType: classType, classDecorator: ((x: any) => any) | undefined, members?: Decorators<classType> | undefined, staticMembers?: StaticDecorators<classType>): void;
export declare function createEntity<T>(key: string, members: T, options?: EntityOptions<InferredType<T>>): {
    new (...args: any[]): InferredType<T>;
};
export declare function createClass<T>(members: T): ClassType<InferredType<T>>;
export {};
