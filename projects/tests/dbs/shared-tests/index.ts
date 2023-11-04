import type { DbTestProps } from './db-tests-props'
import { commonDbTests, type DbTestOptions } from './db-tests'
import { customIdTests } from './test-custom-id-column'
import { testSpecialValues } from './test-special-value'
import { testUpdateWithNull } from './test-update-with-null'

export function allDbTests(props: DbTestProps, options?: DbTestOptions) {
  commonDbTests(props, options)
  customIdTests(props)
  testUpdateWithNull(props)
  testSpecialValues(props)
}
