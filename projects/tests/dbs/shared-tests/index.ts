import type { DbTestProps } from './db-tests-props'
import { commonDbTests, type DbTestOptions } from './db-tests'
import { customIdTests } from './test-custom-id-column'
import { testSpecialValues } from './test-special-value'
import { testUpdateWithNull } from './test-update-with-null'
import { aggregateTest } from './test-aggregate.js'
import { fieldsIdTests } from './fields-id.js'

export function allDbTests(props: DbTestProps, options?: DbTestOptions) {
  aggregateTest(props, options)
  commonDbTests(props, options)
  customIdTests(props)
  testUpdateWithNull(props)
  testSpecialValues(props)
  fieldsIdTests(props)
}
