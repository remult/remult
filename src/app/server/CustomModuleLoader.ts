// @ts-ignore: 
import customModuleLoader = require('module');

export class CustomModuleLoader {
    constructor(root?: string) {
        if (!root)
            root = '/distServer';
        (<any>customModuleLoader)._originalResolveFilename = (<any>customModuleLoader)._resolveFilename;

        (<any>customModuleLoader)._resolveFilename = (request: string, parent: customModuleLoader, isMain: boolean) => {

            if (request.startsWith('radweb')) {
                request = process.cwd() + root + '/projects/' + request + '/';
                console.log(request);
            }


            return (<any>customModuleLoader)._originalResolveFilename(request, parent, isMain);
        }
    }
};