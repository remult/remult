import { RemultAsyncLocalStorage } from './src/context.js'
import { remultStatic } from './src/remult-static.js'
import { initAsyncHooks as _initAsyncHooks } from './server/initAsyncHooks.js'

/**
 * Initializes and enables async context tracking for the server.
 *
 * This should be called before handling any incoming requests or calling `withRemult()`.
 * @example
 * import { remult, repo, withRemult } from 'remult';
 * import { initAsyncHooks } from 'remult/async-hooks';
 *
 * import { Task } from './entities/Task.js';
 *
 * initAsyncHooks();
 *
 * // Thx to the `initAsyncHooks` above,
 * // we have isolated async contexts with multiple `withRemult()`,
 * // without needing to initialize a `remultApi` all the time!
 * withRemult(async () => {
 *     remult.user = { id: '42' };
 *     repo(Task).find()
 * });
 *
 * withRemult(async () => {
 *     remult.user = { id: '21' };
 *     repo(Task).find()
 * });
 */
export function initAsyncHooks() {
  _initAsyncHooks()
  RemultAsyncLocalStorage.enable()
}

/**
 * Makes `remult` fall back to the default instance when there's no request or `withRemult()` call,
 * instead of throwing. Meant for test setup, which calls `repo()` directly while a `remultApi` serves
 * requests.
 * @example
 * import { remult, repo } from 'remult';
 * import { keepDefaultRemult } from 'remult/async-hooks';
 *
 * remult.dataProvider = testDataProvider;
 * keepDefaultRemult();
 *
 * // Later, after a `remultApi` is created
 * await repo(Task).insert({ title: 'from test setup' });
 */
export function keepDefaultRemult() {
  remultStatic.keepDefaultRemult = true
}
