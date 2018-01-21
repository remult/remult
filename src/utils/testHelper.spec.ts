import { InMemoryDataProvider } from './inMemoryDatabase';
import { Categories } from './../app/models';


export function itAsync(name: string, runAsync: () => Promise<any>) { 
  it(name, (done: DoneFn) => {
    runAsync().catch(e => {
      fail(e);
      done();
    }).then(done, e => {
        fail(e);
        done();
      });
  });
}

export interface MDHInterface {
  update?(id: any, data: any): Promise<any>;
  delete?(id: any): Promise<void>;
  insert?(data: any): Promise<any>;
}
export class Done {
  happened = false;
  ok() {
    this.happened = true;
  }
  test() {
    if (!this.happened)
      fail('expected to be done');
  }

}

