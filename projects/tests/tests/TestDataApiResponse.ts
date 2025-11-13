import type { DataApiRequest, DataApiResponse } from '../../core/src/data-api'

export class TestDataApiResponse implements DataApiResponse {
  progress(progress: number): void {}
  success(data: any): void {
    throw new Error('didnt expect success: ' + JSON.stringify(data))
  }
  forbidden(data?: string) {
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
  error(data: any) {
    throw data
  }
}
export class TestDataApiRequest implements DataApiRequest {
  get(key: string): any {
    return undefined
  }
}

export const DummyRequest = {
  get: () => undefined,
}
