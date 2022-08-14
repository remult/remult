import { ClassType } from "../classType";
import { Allowed, AllowedForInstance, EventDispatcher, EventSource, Remult, UserInfo } from "./context";
import { DataProvider } from "./data-interfaces";
import { Repository } from "./remult3";


let defaultRemult = new Remult();

class RemultProxy implements Remult {
    _user: UserInfo;
    _userChangeEvent: EventSource;
    repCache: Map<DataProvider, Map<ClassType<any>, Repository<any>>>;

    setUser(info: UserInfo): Promise<void> {
        throw new Error("Method not implemented.");
    }

    authenticated(): boolean {
        throw new Error("Method not implemented.");
    }
    isAllowed(roles?: Allowed): boolean {
        throw new Error("Method not implemented.");
    }
    isAllowedForInstance(instance: any, allowed?: AllowedForInstance<any>): boolean {
        throw new Error("Method not implemented.");
    }
    get userChange(): EventDispatcher {
        throw new Error("Method not implemented.");
    }
    _dataSource: DataProvider;
    setDataProvider(dataProvider: DataProvider): void {
        throw new Error("Method not implemented.");
    }
    clearAllCache() {
        throw new Error("Method not implemented.");
    }
    /*@internal*/
    remultFactory = () => defaultRemult;
    get instance() {
        return this.remultFactory();
    }

    repo: typeof defaultRemult.repo = (...args) => this.remultFactory().repo(...args);
    get user() {
        return this.remultFactory().user;
    }
}


export const remult = new RemultProxy();