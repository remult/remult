import { describe, expect, test } from 'vitest'
import { makeTitle } from '../../core/src/column.js'

describe('test make title', () => {
  test('id', () => expect(makeTitle('ID')).toBe('ID'))
  test('FIRSTNAME', () => expect(makeTitle('FIRSTNAME')).toBe('FIRSTNAME'))
  test('FirstName', () => expect(makeTitle('FirstName')).toBe('First Name'))

  test('firstName', () => expect(makeTitle('firstName')).toBe('First Name'))
})
