import { GenericRequestInfo, GenericResponse } from './server/index'
import { Remult } from './src/context'
import { ServerEventChannelSubscribeDTO } from './src/live-query/SubscriptionChannel'
import { SubscriptionServer } from './src/live-query/SubscriptionServer'
import { DataApiResponse } from './src/data-api'
import { v4 as uuid } from 'uuid'
import { ConnectionNotFoundError } from './src/live-query/SseSubscriptionClient'

export class SseSubscriptionServer implements SubscriptionServer {
  //@internal
  subscribeToChannel(
    { channel, clientId }: ServerEventChannelSubscribeDTO,
    res: DataApiResponse,
    remult: Remult,
    remove = false,
  ) {
    for (const c of this.connections) {
      if (c.connectionId === clientId) {
        if (this.canUserConnectToChannel(channel, remult)) {
          if (remove) delete c.channels[channel]
          else c.channels[channel] = true
          res.success({ status: 'ok' })
          this.debug()
          return
        } else {
          res.forbidden()
          this.debug()
          return
        }
      }
    }
    res.success(ConnectionNotFoundError)
  }

  //@internal
  private connections: clientConnection[] = []
  constructor(
    private canUserConnectToChannel?: (
      channel: string,
      remult: Remult,
    ) => boolean,
  ) {
    if (!this.canUserConnectToChannel) {
      this.canUserConnectToChannel = () => true
    }
  }

  async publishMessage<T>(channel: string, message: any) {
    const data = JSON.stringify({ channel, data: message })

    for (const sc of this.connections) {
      if (sc.channels[channel]) {
        this.debugMessageFileSaver(sc.connectionId, channel, message)
        sc.write(data)
      }
    }
  }
  //@internal
  debugMessageFileSaver = (id, channel, message) => {}

  //@internal
  openHttpServerStream(
    req: GenericRequestInfo,
    res: GenericResponse & ResponseRequiredForSSE,
  ) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })
    const cc = new clientConnection(res)
    //const lastEventId = req.headers['last-event-id'];
    this.connections.push(cc)
    this.debug()

    //@ts-ignore
    req.on('close', () => {
      cc.close()
      this.connections = this.connections.filter((s) => s !== cc)
      this.debug()
    })
    return cc
  }
  //@internal
  debug() {
    this.debugFileSaver(
      this.connections.map((x) => ({
        id: x.connectionId,
        channels: x.channels,
      })),
    )
  }
  //@internal
  debugFileSaver: (x: any) => void = () => {}
}
export interface ResponseRequiredForSSE {
  write(data: string): void
  writeHead(status: number, headers: any): void
  flush?(): void
}
export class clientConnection {
  channels: Record<string, boolean> = {}
  timeOutRef: NodeJS.Timeout
  close() {
    if (this.timeOutRef) clearTimeout(this.timeOutRef)
    this.closed = true
  }
  closed = false
  write(eventData: string, eventType = 'message'): void {
    let event = 'event:' + eventType
    // if (id != undefined)
    //     event += "\nid:" + id;
    this.response.write(event + '\ndata:' + eventData + '\n\n')
    if (this.response.flush) this.response.flush()
  }
  connectionId = uuid()
  constructor(public response: GenericResponse & ResponseRequiredForSSE) {
    this.write(this.connectionId, 'connectionId')
    this.sendLiveMessage()
  }
  sendLiveMessage() {
    if (this.closed) return
    this.write('', 'keep-alive')
    this.timeOutRef = setTimeout(() => {
      this.sendLiveMessage()
    }, 45000)
  }
}
