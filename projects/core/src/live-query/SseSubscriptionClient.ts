import { buildRestDataProvider } from '../buildRestDataProvider.js'
import { remult } from '../remult-proxy.js'
import { remultStatic } from '../remult-static.js'
import { flags } from '../remult3/remult3.js'
import type {
  ServerEventChannelSubscribeDTO,
  SubscriptionClient,
  SubscriptionClientConnection,
} from './SubscriptionChannel.js'
import { streamUrl } from './SubscriptionChannel.js'
export class SseSubscriptionClient implements SubscriptionClient {
  openConnection(
    onReconnect: VoidFunction,
  ): Promise<SubscriptionClientConnection> {
    let connectionId: string
    const channels = new Map<string, ((value: any) => void)[]>()
    const provider = buildRestDataProvider(remult.apiClient.httpClient)
    let source: EventSource
    let retryCount = 0
    let closed = false
    let connected = false
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined
    let lastConnectAt = 0
    let connectionReady!: () => void
    let connectionPromise = new Promise<void>((res) => {
      connectionReady = res
    })

    function clearReconnectTimer() {
      if (reconnectTimer !== undefined) {
        clearTimeout(reconnectTimer)
        reconnectTimer = undefined
      }
    }

    function scheduleReconnect() {
      if (closed) return
      clearReconnectTimer()
      const delay = Math.min(500 * 2 ** Math.min(retryCount, 5), 8_000)
      retryCount++
      reconnectTimer = setTimeout(() => {
        reconnectTimer = undefined
        createConnection()
      }, delay)
    }

    function resume(force?: boolean) {
      if (closed) return
      const open = source && source.readyState !== EVENT_SOURCE_CLOSED
      if (force) {
        // a source still inside its handshake window is not a zombie yet
        if (open && Date.now() - lastConnectAt < flags.sseStaleMs) return
        createConnection()
        return
      }
      retryCount = 0
      clearReconnectTimer()
      if (!open) createConnection()
    }

    const client: SubscriptionClientConnection = {
      lastServerEvent: Date.now(),
      resume,
      close() {
        closed = true
        clearReconnectTimer()
        source?.close()
      },
      async subscribe(channel, handler) {
        let listeners = channels.get(channel)!

        if (!listeners) {
          channels.set(channel, (listeners = []))
          await connectionPromise
          if (!closed) await subscribeToChannel(channel)
        }
        listeners.push(handler)
        return () => {
          listeners.splice(listeners.indexOf(handler, 1))
          if (listeners.length == 0) {
            remultStatic.actionInfo.runActionWithoutBlockingUI(() =>
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

    function noteServerEvent() {
      client.lastServerEvent = Date.now()
    }

    function createConnection() {
      if (closed) return
      clearReconnectTimer()
      if (source) source.close()
      lastConnectAt = Date.now()
      source = SseSubscriptionClient.createEventSource(
        remult.apiClient.url + '/' + streamUrl,
      )
      source.onmessage = (e) => {
        noteServerEvent()
        let message = JSON.parse(e.data)
        const listeners = channels.get(message.channel)
        if (listeners) listeners.forEach((x) => x(message.data))
      }
      source.addEventListener('keep-alive', () => {
        noteServerEvent()
      })
      source.onerror = (e) => {
        console.error('Live Query Event Source Error', e)
        source.close()
        if (closed) return
        scheduleReconnect()
      }

      source.addEventListener('connectionId', async (e) => {
        //@ts-ignore
        connectionId = e.data
        retryCount = 0
        noteServerEvent()

        if (connected) {
          for (const channel of channels.keys()) {
            await subscribeToChannel(channel)
          }
          onReconnect()
        } else {
          connected = true
          connectionReady()
        }
      })
    }

    createConnection()
    return Promise.resolve(client)

    async function subscribeToChannel(channel: string) {
      const result = await remultStatic.actionInfo.runActionWithoutBlockingUI(
        () => {
          return provider.post(
            remult.apiClient.url + '/' + streamUrl + '/subscribe',
            {
              channel: channel,
              clientId: connectionId,
            } as ServerEventChannelSubscribeDTO,
          )
        },
      )
      if (result === ConnectionNotFoundError) {
        connected = false
        connectionPromise = new Promise<void>((res) => {
          connectionReady = res
        })
        createConnection()
        await connectionPromise
        if (!closed) await subscribeToChannel(channel)
      }
    }
  }
  static createEventSource(url: string) {
    return new EventSource(url, {
      withCredentials: true,
    })
  }
}

export const ConnectionNotFoundError = 'client connection not found'
// EventSource.CLOSED; the global is absent in Node
const EVENT_SOURCE_CLOSED = 2
