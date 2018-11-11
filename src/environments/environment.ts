import { RestDataProvider, DataProviderFactory } from "radweb";

var serverUrl = 'http://localhost:3001/';
if (typeof (window) === 'undefined') {

}
else {
  serverUrl = 'http://' + window.location.hostname + ':3001/';// + window.location.hostname + ':3000/';
}

export const environment = {
  production: false,
  serverUrl,
  //dataSource: new LocalStorageDataProvider() as DataProviderFactory
  dataSource: new RestDataProvider(serverUrl + 'dataapi') as DataProviderFactory
};
