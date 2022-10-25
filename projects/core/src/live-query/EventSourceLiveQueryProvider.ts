import { buildRestDataProvider } from "../context";
import { remult } from "../remult-proxy";
import { ServerEventChannelSubscribeDTO, LiveQueryProvider, MessageHandler, PubSubClient, streamUrl } from "./LiveQuerySubscriber";

export class EventSourceLiveQueryProvider implements LiveQueryProvider {
  constructor(private wrapMessage?: (what: () => void) => void) {
    if (!this.wrapMessage)
      this.wrapMessage = x => x();
  }
  openStreamAndReturnCloseFunction(onMessage: MessageHandler, onReconnect: VoidFunction): Promise<PubSubClient> {

    const source = new EventSource(remult.apiClient.url + '/' + streamUrl, {
      withCredentials: true
    });
    source.onmessage = e => {
      this.wrapMessage(() =>
        onMessage(JSON.parse(e.data)));
    };
    source.onerror = e => {
      console.error("Live Query Event Source Error", e);
    }
    let connectionId: string;
    source.addEventListener("connectionId", e => {
      //@ts-ignore
      connectionId = e.data;

    });
    const provider = buildRestDataProvider(remult.apiClient.httpClient);
    const client: PubSubClient = {
      disconnect() {
        source.close();
      },
      subscribe(channel) {
        provider.post(remult.apiClient.url + '/' + streamUrl, {
          channel: channel,
          clientId: connectionId,
          remove: false
        } as ServerEventChannelSubscribeDTO);
        return () => {
          provider.post(remult.apiClient.url + '/' + streamUrl, {
            channel: channel,
            clientId: connectionId,
            remove: true
          } as ServerEventChannelSubscribeDTO);
        }
      },
    }
    return new Promise<PubSubClient>((res) => {
      let connected = false;
      source.onopen = e => {
        if (connected)
          onReconnect();
        connected = true;
        res(client)
      }
    });
  }
}