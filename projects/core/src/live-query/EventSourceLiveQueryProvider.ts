import { remult } from "../remult-proxy";
import { LiveQueryProvider, MessageHandler, streamUrl } from "./LiveQuerySubscriber";

export class EventSourceLiveQueryProvider implements LiveQueryProvider {
  constructor(private wrapMessage?: (what: () => void) => void) {
    if (!this.wrapMessage)
      this.wrapMessage = x => x();
  }
  openStreamAndReturnCloseFunction(clientId: string, onMessage: MessageHandler): Promise<VoidFunction> {

    const source = new EventSource(remult.apiClient.url + '/' + streamUrl + "?id=" + clientId, {
      withCredentials: true
    });
    source.onmessage = e => {
      this.wrapMessage(() =>
        onMessage(JSON.parse(e.data)));
    };
    return new Promise<VoidFunction>((res) => {
      source.onopen = e => {
        res(() => {
          source.close();
        })
      }
    });
  }
}