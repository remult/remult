import { SiteArea } from "./expressBridge";
import { LiveQueryProvider } from "../src/data-api";
import { ClassType } from "../classType";
export declare function registerEntitiesOnServer(area: SiteArea, entities: ClassType<any>[], lqp: LiveQueryProvider): void;
