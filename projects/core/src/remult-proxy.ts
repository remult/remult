import { ClassType } from "../classType.js";
import { Allowed, AllowedForInstance, ApiClient, EventDispatcher, EventSource, Remult, RemultContext, UserInfo } from "./context.js";
import { DataProvider } from "./data-interfaces.js";
import { Repository, RepositoryImplementation } from "./remult3/index.js";


let defaultRemult = new Remult();
/*@internal*/
export class RemultProxy implements Remult {
    call<T extends (...args: any[]) => Promise<Y>, Y>(backendMethod: T, self?: any): T {
        return this.remultFactory().call(backendMethod, self);
    }
    get context(): RemultContext {
        return this.remultFactory().context;
    }


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
    get apiClient(): ApiClient {
        return this.remultFactory().apiClient;
    }
    set apiClient(client: ApiClient) {
        this.remultFactory().apiClient = client;
    }
}


export const remult: Remult = new RemultProxy();
RepositoryImplementation.defaultRemult = remult;