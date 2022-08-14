import { Allowed, AllowedForInstance, EventDispatcher, Remult, UserInfo } from "./context";
import { DataProvider } from "./data-interfaces";
declare let defaultRemult: Remult;
declare class RemultProxy implements Remult {
    setUser(info: UserInfo): Promise<void>;
    authenticated(): boolean;
    isAllowed(roles?: Allowed): boolean;
    isAllowedForInstance(instance: any, allowed?: AllowedForInstance<any>): boolean;
    get userChange(): EventDispatcher;
    _dataSource: DataProvider;
    setDataProvider(dataProvider: DataProvider): void;
    clearAllCache(): void;
    get instance(): Remult;
    repo: typeof defaultRemult.repo;
    get user(): UserInfo;
}
export declare const remult: RemultProxy;
export {};
