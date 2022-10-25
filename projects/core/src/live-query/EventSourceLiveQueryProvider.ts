import { remult } from "../remult-proxy";
import { ChannelSubscribe, LiveQueryProvider, MessageHandler, PubSubClient, streamUrl } from "./LiveQuerySubscriber";

export class EventSourceLiveQueryProvider implements LiveQueryProvider {
  constructor(private wrapMessage?: (what: () => void) => void) {
    if (!this.wrapMessage)
      this.wrapMessage = x => x();
  }
  openStreamAndReturnCloseFunction(clientId: string, onMessage: MessageHandler, onReconnect: VoidFunction): Promise<PubSubClient> {

    const source = new EventSource(remult.apiClient.url + '/' + streamUrl + "?id=" + clientId, {
      withCredentials: true
    });
    source.onmessage = e => {
      this.wrapMessage(() =>
        onMessage(JSON.parse(e.data)));
    };
    source.onerror = e => {
      console.error("Live Query Event Source Error", e);
    }
    const client: PubSubClient = {
      disconnect() {
        source.close();
      },
      subscribe(channel) {
        this.provider.post(remult.apiClient.url + '/' + streamUrl, {
          channel: channel,
          clientId: this.clientId,
          remove: false
        } as ChannelSubscribe);
        return () => {
          this.provider.post(remult.apiClient.url + '/' + streamUrl, {
            channel: channel,
            clientId: this.clientId,
            remove: true
          } as ChannelSubscribe);
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