import { EntityOptions } from "../entity";
import { ClassType } from "../../classType";
import { Remult } from "../context";
import { OmitEB } from "./remult3";
import { BackendMethodOptions } from "../server-action";
export declare function BuildEntity<entityType>(c: ClassType<entityType>, key: string, fields: BuildEntityFields<entityType>, ...options: (EntityOptions<entityType> | ((options: EntityOptions<entityType>, remult: Remult) => void))[]): void;
export declare type BuildEntityFields<entityType> = {
    [Properties in keyof Partial<OmitEB<entityType>>]: any;
};
export declare function DescribeStaticBackendMethod<T>(cls: T, methodName: keyof T, options: BackendMethodOptions<any>, paramTypes?: any[]): void;
export declare function DescribeBackendMethod<T>(cls: ClassType<T>, methodName: keyof T, options: BackendMethodOptions<any>, paramTypes?: any[]): void;
