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
                case "@remult/server-postgres":
                    request = request = process.cwd() + root + '/server-postgres';
                    break;
            }



            return (<any>customModuleLoader)._originalResolveFilename(request, parent, isMain);
        }
    }
};