import { SubClient, SubClientConnection } from "./LiveQuerySubscriber";
export declare class EventSourceLiveQueryProvider implements SubClient {
    openConnection(onReconnect: VoidFunction): Promise<SubClientConnection>;
}
