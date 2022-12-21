import { SubClient, SubClientConnection } from "./LiveQuerySubscriber";
export declare class EventSourceSubClient implements SubClient {
    openConnection(onReconnect: VoidFunction): Promise<SubClientConnection>;
}
