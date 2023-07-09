export class Done {
  happened = false
  ok() {
    this.happened = true
  }
  test(message = 'expected to be done') {
    expect(this.happened).toBe(true, message)
  }
}
