import { it, expect } from 'vitest'
import { remult } from '../core/src/remult-proxy'
it('first test', () => {
  expect(1 + 1).toBe(2)
})
it('test local storage', () => {
  localStorage.setItem('a', 'b')
  expect(localStorage.getItem('a')).toBe('b')
})
it('test remult works', () => {
  remult.user = { id: '1', name: 'noam' }
  expect(remult.user.name).toBe('noam')
})
