import { describe, it, expect } from 'vitest'
export class Done {
  happened = false
  ok() {
    this.happened = true
  }
  test(message = 'expected to be done') {
    expect(this.happened).to.eq(true, message)
  }
}
