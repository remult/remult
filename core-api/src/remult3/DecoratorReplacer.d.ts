import { EntityOptions } from "../entity";
import { ClassType } from "../../classType";
import { Remult } from "../context";
import { OmitEB } from "./remult3";
import { BackendMethodOptions } from "../server-action";
export declare function BuildEntity<entityType>(c: entityType, key: string, fields: MembersAndStaticMembers<entityType>, ...options: (EntityOptions<entityType> | ((options: EntityOptions<entityType>, remult: Remult) => void))[]): void;
declare type Decorator = (a: any, b: string, c?: any) => void;
declare type Members<T> = T extends new (...args: any[]) => infer R ? {
    [K in keyof OmitEB<R>]?: Decorator;
} : never;
declare type StaticMembers<T> = {
    [K in keyof T]?: Decorator;
};
declare type MembersAndStaticMembers<T> = Members<T> & {
    static?: StaticMembers<T>;
};
export declare function DescribeStaticBackendMethod<T>(cls: T, methodName: keyof T, options: BackendMethodOptions<any>, paramTypes?: any[]): void;
export declare function DescribeBackendMethod<T>(cls: ClassType<T>, methodName: keyof T, options: BackendMethodOptions<any>, paramTypes?: any[]): void;
export {};
