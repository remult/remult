import { ClassType } from "../classType";
import { Allowed, AllowedForInstance, EventDispatcher, EventSource, Remult, RemultContext, UserInfo } from "./context";
import { DataProvider } from "./data-interfaces";
import { Repository } from "./remult3";


let defaultRemult = new Remult();
/*@internal*/
export class RemultProxy implements Remult {
    get context(): RemultContext {
        return this.instance.context;
    }
    get _user(): UserInfo {
        return this.instance._user;
    };
    get _userChangeEvent(): EventSource { return this.instance._userChangeEvent };
    get _dataSource(): DataProvider { return this.instance._dataSource };
    get repCache(): Map<DataProvider, Map<ClassType<any>, Repository<any>>> { return this.instance.repCache };

    setUser(info: UserInfo): Promise<void> {
        return this.instance.setUser(info);
    }

    authenticated(): boolean {
        return this.instance.authenticated()
    }
    isAllowed(roles?: Allowed): boolean {
        return this.instance.isAllowed(roles);
    }
    isAllowedForInstance(instance: any, allowed?: AllowedForInstance<any>): boolean {
        return this.instance.isAllowedForInstance(instance, allowed);
    }
    get userChange(): EventDispatcher {
        return this.instance.userChange;
    }

    setDataProvider(dataProvider: DataProvider): void {
        return this.instance.setDataProvider(dataProvider);
    }
    clearAllCache() {
        return this.instance.clearAllCache();
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


export const remult: Remult = new RemultProxy();