import { DataProviderFactory } from './../utils/DataInterfaces';
import { RestDataProvider } from './../utils/restDataProvider';
import { InMemoryDataProvider } from './../utils/inMemoryDatabase';
import { LocalStorageDataProvider } from './../utils/localStorageDataProvider';
// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

const serverUrl= 'http://localhost:3000/';
export const environment = {
  production: false,
  serverUrl,
  //dataSource: new LocalStorageDataProvider() as DataProviderFactory
  dataSource : new RestDataProvider(serverUrl+ 'dataapi') as DataProviderFactory
};
