import { buildRestDataProvider } from "../context";
import { remult } from "../remult-proxy";
import { ServerEventChannelSubscribeDTO, LiveQueryProvider, PubSubClient, streamUrl } from "./LiveQuerySubscriber";
// TODO - connect stream when server is not yet up - for angular proxy
export class EventSourceLiveQueryProvider implements LiveQueryProvider {
  openStreamAndReturnCloseFunction(onReconnect: VoidFunction): Promise<PubSubClient> {

    const source = new EventSource(remult.apiClient.url + '/' + streamUrl, {
      withCredentials: true
    });
    const channels = new Map<string, ((value: any) => void)[]>();
    source.onmessage = e => {
      let message = JSON.parse(e.data);
      const listeners = channels.get(message.channel)
      if (listeners)
        listeners.forEach(x => x(message.data));
    };
    source.onerror = e => {
      console.error("Live Query Event Source Error", e);
    }
    let connectionId: string;

    const provider = buildRestDataProvider(remult.apiClient.httpClient);
    const client: PubSubClient = {
      disconnect() {
        source.close();
      },
      subscribe(channel, handler) {
        let listeners = channels.get(channel);
        if (!listeners)
          channels.set(channel, listeners = []);
        listeners.push(handler);
        provider.post(remult.apiClient.url + '/' + streamUrl + '/subscribe', {
          channel: channel,
          clientId: connectionId
        } as ServerEventChannelSubscribeDTO);
        return () => {
          listeners.splice(listeners.indexOf(handler, 1));
          provider.post(remult.apiClient.url + '/' + streamUrl + '/unsubscribe', {
            channel: channel,
            clientId: connectionId
          } as ServerEventChannelSubscribeDTO);
        }
      },
    }
    return new Promise<PubSubClient>((res) => {
      let connected = false;
      source.addEventListener("connectionId", e => {
        //@ts-ignore
        connectionId = e.data;
        if (connected)
          onReconnect();
        connected = true;
        res(client)
      });
    });
  }
}
