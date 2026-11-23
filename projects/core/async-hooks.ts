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
 * Tests only: outside a request or `withRemult()`, `remult` falls back to the default instance instead of throwing.
 *
 * Never call it in a server: code outside a request (timers, queues) would silently run with no user.
 *
 * The default instance is shared: set `remult.dataProvider` to the one passed to `remultApi`, and reset `remult.user` between tests.
 * @example
 * import { remult, repo } from 'remult';
 * import { allowDefaultRemult_FOR_TESTS_ONLY } from 'remult/async-hooks';
 *
 * remult.dataProvider = dataProvider; // same as remultApi({ dataProvider })
 * allowDefaultRemult_FOR_TESTS_ONLY();
 *
 * await repo(Task).insert({ title: 'from test setup' });
 *
 * // afterAll
 * allowDefaultRemult_FOR_TESTS_ONLY(false);
 */
export function allowDefaultRemult_FOR_TESTS_ONLY(allow = true) {
  remultStatic.allowDefaultRemult = allow
}
