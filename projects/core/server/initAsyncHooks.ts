import { AsyncLocalStorage } from 'async_hooks';
import { RemultAsyncLocalStorage } from './expressBridge';

let init = false;

export function initAsyncHooks() {
  return;
  if (init)
    return;
  init=true;
  RemultAsyncLocalStorage.instance = new RemultAsyncLocalStorage(new AsyncLocalStorage());

}