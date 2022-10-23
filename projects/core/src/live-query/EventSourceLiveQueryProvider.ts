import { remult } from "../remult-proxy";
import { LiveQueryProvider, MessageHandler, streamUrl } from "./LiveQuerySubscriber";

export class EventSourceLiveQueryProvider implements LiveQueryProvider {
  constructor(private wrapMessage?: (what: () => void) => void) {
    if (!this.wrapMessage)
      this.wrapMessage = x => x();
  }
  openStreamAndReturnCloseFunction(clientId: string, onMessage: MessageHandler, onReconnect: VoidFunction): Promise<VoidFunction> {

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

    return new Promise<VoidFunction>((res) => {
      let connected = false;
      source.onopen = e => {
        if (connected)
          onReconnect();
        connected = true;
        res(() => {
          source.close();
        })
      }
    });
  }
}