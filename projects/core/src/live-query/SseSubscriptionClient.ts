import { buildRestDataProvider } from '../buildRestDataProvider'
import { remult } from '../remult-proxy'
import { actionInfo } from '../server-action'
import {
  ServerEventChannelSubscribeDTO,
  SubscriptionClient,
  SubscriptionClientConnection,
  streamUrl,
} from './SubscriptionChannel'
export class SseSubscriptionClient implements SubscriptionClient {
  openConnection(
    onReconnect: VoidFunction,
  ): Promise<SubscriptionClientConnection> {
    let connectionId: string
    const channels = new Map<string, ((value: any) => void)[]>()
    const provider = buildRestDataProvider(remult.apiClient.httpClient)
    let connected = false
    let source: EventSource
    const client: SubscriptionClientConnection = {
      close() {
        source.close()
      },
      async subscribe(channel, handler) {
        let listeners = channels.get(channel)

        if (!listeners) {
          channels.set(channel, (listeners = []))
          await subscribeToChannel(channel)
        }
        listeners.push(handler)
        return () => {
          listeners.splice(listeners.indexOf(handler, 1))
          if (listeners.length == 0) {
            actionInfo.runActionWithoutBlockingUI(() =>
              provider.post(
                remult.apiClient.url + '/' + streamUrl + '/unsubscribe',
                {
                  channel: channel,
                  clientId: connectionId,
                } as ServerEventChannelSubscribeDTO,
              ),
            )
            channels.delete(channel)
          }
        }
      },
    }
    const createConnectionPromise = () =>
      new Promise<SubscriptionClientConnection>((res) => {
        createConnection()

        function createConnection() {
          if (source) source.close()
          source = new EventSource(remult.apiClient.url + '/' + streamUrl, {
            withCredentials: true,
          })
          source.onmessage = (e) => {
            let message = JSON.parse(e.data)
            const listeners = channels.get(message.channel)
            if (listeners) listeners.forEach((x) => x(message.data))
          }
          source.onerror = (e) => {
            console.error('Live Query Event Source Error', e)
            source.close()
            setTimeout(() => {
              createConnection()
            }, 500)
          }

          source.addEventListener('connectionId', async (e) => {
            //@ts-ignore
            connectionId = e.data

            if (connected) {
              for (const channel of channels.keys()) {
                await subscribeToChannel(channel)
              }
              onReconnect()
            } else {
              connected = true
              res(client)
            }
          })
        }
      })
    return createConnectionPromise()
    async function subscribeToChannel(channel: string) {
      const result = await actionInfo.runActionWithoutBlockingUI(() => {
        return provider.post(
          remult.apiClient.url + '/' + streamUrl + '/subscribe',
          {
            channel: channel,
            clientId: connectionId,
          } as ServerEventChannelSubscribeDTO,
        )
      })
      if (result === ConnectionNotFoundError) {
        await createConnectionPromise()
      }
    }
  }
}

export const ConnectionNotFoundError = 'client connection not found'
