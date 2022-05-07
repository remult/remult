// @ts-ignore: 
import customModuleLoader = require('module');
var done = false
export class CustomModuleLoader {
    constructor(root?: string) {
        if (!root)
            root = '/distServer';
        if (done)
            return;
        done = true;
        (<any>customModuleLoader)._originalResolveFilename = (<any>customModuleLoader)._resolveFilename;

        (<any>customModuleLoader)._resolveFilename = (request: string, parent: customModuleLoader, isMain: boolean) => {
            switch (request) {
                case "remult":
                    request = request = process.cwd() + root + '/core';
                    break;
                case "@remult/angular":
                    request = request = process.cwd() + root + '/angular';
                    break;
                    case "@remult/angular/interfaces":
                    request = request = process.cwd() + root + '/angular/interfaces';
                    break;
                case "remult/server":
                    request = request = process.cwd() + root + '/core/server';
                    break;
                case "remult/postgres":
                    request = request = process.cwd() + root + '/core/postgres';
                    break;
                    case "remult/graphql":
                    request = request = process.cwd() + root + '/core/graphql';
                    break;
                case "remult/src/context":
                    request = request = process.cwd() + root + '/core/src/context';
                    break;
                case "remult/src/remult3":
                    request = request = process.cwd() + root + '/core/src/remult3';
                    break;
                case "remult/src/server-action":
                    request = request = process.cwd() + root + '/core/src/server-action';
                    break;
                case "remult/inputTypes":
                    request = request = process.cwd() + root + '/core/inputTypes';
                    break;
                    case "remult/remult-knex":
                    request = request = process.cwd() + root + '/core/remult-knex';
                    break;
                case "remult/src/filter/filter-interfaces":
                    request = request = process.cwd() + root + '/core/src/filter/filter-interfaces';
                    break;
                case "remult/valueConverters":
                    request = request = process.cwd() + root + '/core/valueConverters';
                    break;
            }



            return (<any>customModuleLoader)._originalResolveFilename(request, parent, isMain);
        }
    }
};