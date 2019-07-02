import customModuleLoader = require('module');

export class CustomModuleLoader {
    constructor() {
        (<any>customModuleLoader)._originalResolveFilename = (<any>customModuleLoader)._resolveFilename;

        (<any>customModuleLoader)._resolveFilename = (request: string, parent: customModuleLoader, isMain: boolean) => {

            if (request == 'radweb') {
                request = process.cwd()+'/distServer/projects/radweb/src/public_api.js';
            }
            if (request=='radweb-server'){
                request = process.cwd()+'/distServer/projects/radweb-server/index.js';
            }
            
            return (<any>customModuleLoader)._originalResolveFilename(request, parent, isMain);
        }
    }
};