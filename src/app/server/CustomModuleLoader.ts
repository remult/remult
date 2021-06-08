// @ts-ignore: 
import customModuleLoader = require('module');

export class CustomModuleLoader {
    constructor(root?: string) {
        if (!root)
            root = '/distServer';
        (<any>customModuleLoader)._originalResolveFilename = (<any>customModuleLoader)._resolveFilename;

        (<any>customModuleLoader)._resolveFilename = (request: string, parent: customModuleLoader, isMain: boolean) => {
            switch (request) {
                case "@remult/core":
                    request = request = process.cwd() + root + '/core';
                    break;

                case "@remult/angular":
                    request = request = process.cwd() + root + '/angular';
                    break;
                case "@remult/core/server":
                    request = request = process.cwd() + root + '/core/server';
                    break;
                case "@remult/core/postgres":
                    request = request = process.cwd() + root + '/core/postgres';
                    break;
                case "@remult/core/src/context":
                    request = request = process.cwd() + root + '/core/src/context';
                    break;
                case "@remult/core/src/remult3":
                    request = request = process.cwd() + root + '/core/src/remult3';
                    break;
                case "@remult/core/src/server-action":
                    request = request = process.cwd() + root + '/core/src/server-action';
                    break;
                    case "@remult/core/valueConverters":
                    request = request = process.cwd() + root + '/core/valueConverters';
                    break;
            }



            return (<any>customModuleLoader)._originalResolveFilename(request, parent, isMain);
        }
    }
};