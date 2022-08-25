import { ClassType } from "../classType";
import { Allowed, AllowedForInstance, EventDispatcher, EventSource, Remult, RemultContext, UserInfo } from "./context";
import { DataProvider } from "./data-interfaces";
import { Repository, RepositoryImplementation } from "./remult3";


let defaultRemult = new Remult();
/*@internal*/
export class RemultProxy implements Remult {
    get context(): RemultContext {
        return this.remultFactory().context;
    }
    get _user(): UserInfo {
        return this.remultFactory()._user;
    };

    get dataProvider(): DataProvider { return this.remultFactory().dataProvider };
    set dataProvider(provider: DataProvider) { this.remultFactory().dataProvider = provider }
    get repCache(): Map<DataProvider, Map<ClassType<any>, Repository<any>>> { return this.remultFactory().repCache };

    authenticated(): boolean {
        return this.remultFactory().authenticated()
    }
    isAllowed(roles?: Allowed): boolean {
        return this.remultFactory().isAllowed(roles);
    }
    isAllowedForInstance(instance: any, allowed?: AllowedForInstance<any>): boolean {
        return this.remultFactory().isAllowedForInstance(instance, allowed);
    }

    clearAllCache() {
        return this.remultFactory().clearAllCache();
    }
    /*@internal*/
    remultFactory = () => defaultRemult;


    repo: typeof defaultRemult.repo = (...args) => this.remultFactory().repo(...args);
    get user() {
        return this.remultFactory().user;
    }
    set user(info: UserInfo | undefined) {
        this.remultFactory().user = info;
    }
}


export const remult: Remult = new RemultProxy();
RepositoryImplementation.defaultRemult = remult;