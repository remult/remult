// @ts-ignore: 
import customModuleLoader = require('module');

export class CustomModuleLoader {
    constructor(root?:string) {
        if (!root)
        root = '/distServer';
        (<any>customModuleLoader)._originalResolveFilename = (<any>customModuleLoader)._resolveFilename;

        (<any>customModuleLoader)._resolveFilename = (request: string, parent: customModuleLoader, isMain: boolean) => {

            if (request == 'radweb') {
                request = process.cwd()+root+'/projects/radweb/src/public_api.js';
                console.log(request);
            }
            if (request=='radweb-server'){
                request = process.cwd()+root+'/projects/radweb-server/index.js';
                console.log(request);
            }
            if (request=='radweb-server-postgres'){
                request = process.cwd()+root+'/projects/radweb-server-postgres/PostgresDataProvider.js';
                console.log(request);
            }
            
            return (<any>customModuleLoader)._originalResolveFilename(request, parent, isMain);
        }
    }
};