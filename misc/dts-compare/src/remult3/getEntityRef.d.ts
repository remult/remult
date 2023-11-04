import type { ClassType } from '../../classType';
import type { EntityOptionsFactory } from './RepositoryImplementation';
import type { EntityRef } from './remult3';
export declare function getEntityRef<entityType>(entity: entityType, throwException?: boolean): EntityRef<entityType>;
export declare const entityMember: unique symbol;
export declare const entityInfo: unique symbol;
export declare const entityInfo_key: unique symbol;
export declare function getEntitySettings<T>(entity: ClassType<T>, throwError?: boolean): EntityOptionsFactory;
export declare function getEntityKey(entity: ClassType<any>): string;
