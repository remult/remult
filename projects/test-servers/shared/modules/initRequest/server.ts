import { Module } from '../../../../core/server/module.js'
import { remult } from '../../../../core'

/**
 * in next-server, we need to copy the same module...
 *
 * Here is the [file to edit](../../../next-server/src/pages/api/[...remult].ts)
 *
 * I would love to have only THIS module to test, all server are working except next-server...!
 * Maybe the shared modules should be in next-server!
 */
export const initRequestModule = new Module({
  key: 'init-request-module',
  async initRequest() {
    if (remult.context.headers?.get('remult-test-crash-ctx') === 'yes-c') {
      throw new Error('test crash')
    }
  },
})
