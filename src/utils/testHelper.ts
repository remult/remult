import { DataHelper } from './dataInterfaces';

export function itAsync(name: string, runAsync: () => Promise<any>) {
  it(name, (done: DoneFn) => {
    runAsync().catch(e => {
      fail(e);
      done();
    })
      .then(done, e => {
        fail(e);
        done();
      });
  });
}
export class MockDataHelper implements DataHelper {
  insert: (data: any) => Promise<any>;
  update: (id: any, data: any) => Promise<any>;
  delete: (id: any) => Promise<void>;
  constructor(args?: MDHInterface) {
    if (args)
      Object.assign(this, args);

  }
}
export interface MDHInterface {
  update?(id: any, data: any): Promise<any>;
  delete?(id: any): Promise<void>;
  insert?(data: any): Promise<any>;
}



