import { DataApiResponse } from '../data-api'

export class TestDataApiResponse implements DataApiResponse {
  progress(progress: number): void {}
  success(data: any): void {
    throw new Error('didnt expect success: ' + JSON.stringify(data))
  }
  forbidden() {
    throw new Error('didnt expect forbidden:')
  }
  created(data: any): void {
    throw new Error('didnt expect created: ' + JSON.stringify(data))
  }
  deleted(): void {
    throw new Error('didnt expect deleted:')
  }
  notFound(): void {
    throw new Error('not found')
  }
  error(data) {
    throw new Error('error: ' + data + ' ' + JSON.stringify(data))
  }
}
