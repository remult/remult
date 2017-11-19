

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

export interface MDHInterface {
  update?(id: any, data: any): Promise<any>;
  delete?(id: any): Promise<void>;
  insert?(data: any): Promise<any>;
}



