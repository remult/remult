import { RestDataProvider } from './../utils/restDataProvider';
// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

const serverUrl= 'http://localhost:56557/';
export const environment = {
  production: false,
  serverUrl,
  dataSource : new RestDataProvider(serverUrl+ 'dataapi')
};
