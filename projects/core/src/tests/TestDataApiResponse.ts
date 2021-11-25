import { DataApiResponse } from "../data-api";


export class TestDataApiResponse implements DataApiResponse {
  progress(progress: number): void {
  }
  success(data: any): void {
    fail('didnt expect success: ' + JSON.stringify(data));
  }
  forbidden() {
    fail('didnt expect forbidden:');
  }
  created(data: any): void {
    fail('didnt expect created: ' + JSON.stringify(data));
  }
  deleted(): void {
    fail('didnt expect deleted:');
  }
  notFound(): void {
    fail('not found');
  }
  error(data) {
    fail('error: ' + data + " " + JSON.stringify(data));
  }

}
