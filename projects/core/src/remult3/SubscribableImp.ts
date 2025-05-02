import type { Unsubscribe } from '../live-query/SubscriptionChannel.js'
import type { Subscribable, RefSubscriberBase } from './remult3.js'

export class SubscribableImp implements Subscribable {
  reportChanged() {
    if (this._subscribers) this._subscribers.forEach((x) => x.reportChanged())
  }
  reportObserved() {
    if (this._subscribers) this._subscribers.forEach((x) => x.reportObserved())
  }
  private _subscribers?: RefSubscriberBase[]
  subscribe(
    listener:
      | (() => void)
      | {
          reportChanged: () => void
          reportObserved: () => void
        },
  ): Unsubscribe {
    let list: {
      reportChanged: () => void
      reportObserved: () => void
    }
    if (typeof listener === 'function')
      list = {
        reportChanged: () => listener(),
        reportObserved: () => {},
      }
    else list = listener

    if (!this._subscribers) {
      this._subscribers = []
    }
    this._subscribers.push(list)
    return () =>
      (this._subscribers = this._subscribers!.filter((x) => x != list))
  }
}
