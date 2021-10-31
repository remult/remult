/*
run in target project folder for testing:
node /Users/Yoni/AppData/Roaming/npm/node_modules/@angular-devkit/schematics-cli/bin/schematics.js /repos/radweb/dist/angular/schematics/collection.json:ng-add --dry-run false
*/
import { Rule, SchematicContext, Tree, apply, mergeWith, template, url, SchematicsException } from '@angular-devkit/schematics';

import { strings } from '@angular-devkit/core';

import { Schema } from './schema';

import { getWorkspace } from '../schematics-angular-utils/config';
import { findModuleFromOptions } from '../schematics-angular-utils/find-module';
import { NodePackageInstallTask, RunSchematicTask } from '@angular-devkit/schematics/tasks';
import { addSymbolToNgModuleMetadata } from '../schematics-angular-utils/ast-utils';
import * as ts from 'typescript';
import { InsertChange } from '../schematics-angular-utils/change';



// You don't have to export the function as default. You can also have more than one rule factory
// per file.
export function hello(_options: Schema): Rule {
  return (tree: Tree, _context: SchematicContext) => {

    editPackageJson(tree);
    const installTaskId = _context.addTask(new NodePackageInstallTask());
    _context.addTask(new RunSchematicTask('@angular/material/schematics/collection.json', 'ng-add', { gestures: true, typography: true, animations: true, theme: 'indigo-pink' }), [installTaskId]);
    let appTsConfig = "./tsconfig.app.json";
    if (!tree.exists(appTsConfig))
      appTsConfig = "./src/tsconfig.app.json";

    editJson(tree, appTsConfig, j => {
      j.compilerOptions.emitDecoratorMetadata = true;
    });


    editGitIgnore(tree);
    let entryComponents = [{ name: 'YesNoQuestionComponent', path: './common/yes-no-question/yes-no-question.component' },
    { name: 'InputAreaComponent', path: './common/input-area/input-area.component' },

    ];

    addToNgModule(tree, {
      declarations: [
        { name: 'UsersComponent', path: './users/users.component' },
        { name: 'HomeComponent', path: './home/home.component' },
        ...entryComponents
      ],
      imports: [
        { name: 'FormsModule', path: '@angular/forms' },
        { name: 'MatSidenavModule', path: '@angular/material/sidenav' },
        { name: 'MatListModule', path: '@angular/material/list' },
        { name: 'MatToolbarModule', path: '@angular/material/toolbar' },
        { name: 'MatCheckboxModule', path: '@angular/material/checkbox' },
        { name: 'MatCardModule', path: '@angular/material/card' },
        { name: 'MatDialogModule', path: '@angular/material/dialog' },
        { name: 'MatSnackBarModule', path: '@angular/material/snack-bar' },
        { name: 'MatFormFieldModule', path: '@angular/material/form-field' },
        { name: 'MatInputModule', path: '@angular/material/input' },
        { name: 'MatButtonModule', path: '@angular/material/button' },
        { name: 'MatIconModule', path: '@angular/material/icon' },
        { name: 'MatMenuModule', path: '@angular/material/menu' },
        { name: 'RemultModule', path: '@remult/angular' },
      ],
      providers: [
        { name: 'DialogService', path: './common/dialog' },
        { name: 'AdminGuard', path: './users/roles' }
      ]
      , entryComponents: entryComponents

    });

    var project: string = 'did not find project';
    editJson(tree, "./angular.json", j => {
      for (const p in j.projects) {
        project = p;
        if (j.projects.hasOwnProperty(p)) {
          const element = j.projects[p];
          //    element.architect.serve.options.proxyConfig = "proxy.conf.json";
          element.architect.build.options.styles.push("./node_modules/@remult/angular/input-styles.scss");
          return;
        }
      }
    });

    try {
      tree.delete('./src/app/app.component.html');
      tree.delete('./src/app/app.component.ts');
      tree.delete('./src/app/app.component.scss');
      tree.delete('./src/app/app-routing.module.ts');
      tree.delete('./src/app/app.component.spec.ts');
    }
    catch { }

    //    addDeclarationToModule()
    const sourceTemplates = url('./files');
    const sourceParametrizedTemplates = apply(sourceTemplates, [
      template({
        ..._options,
        ...strings,
        ...{ project },
        ...{
          postgresUserName: 'postgres',
          postgresPassword: 'MASTERKEY',
          tokenSignKey: 'secret-key-replace-me-soon'

        }
      })
    ]);

    return mergeWith(sourceParametrizedTemplates);
  };

  function editPackageJson(tree: Tree) {
    editJson(tree, './package.json', json => {
      json.scripts["dev-ng"] = "ng serve  --proxy-config proxy.conf.json";
      json.scripts["dev-node"] = "ts-node-dev --project tsconfig.server.json src/server/";
      json.scripts["build"] = "ng build && tsc -p tsconfig.server.json";
      json.scripts.start = "node dist/server/server/";
      json.dependencies["dotenv"] = "^8.1.0";
      json.dependencies["password-hash"] = "^1.2.2";
      json.dependencies["remult"] = json.dependencies["@remult/angular"];
      json.dependencies["pg"] = "^8.3.0";
      json.dependencies["helmet"] = "^4.6.0";
      json.dependencies["jsonwebtoken"] = "^8.5.1";
      json.dependencies["@auth0/angular-jwt"] = "^5.0.2";
      json.dependencies["express-jwt"] = "^6.0.0";
      json.dependencies["express"] = "^4.16.4";
      json.dependencies["reflect-metadata"] = "^0.1.12";
      json.dependencies["compression"] = "^1.7.3";
      json.dependencies["express-graphql"] = "^0.12.0";
      json.dependencies["graphql"] = "^16.0.0";
      json.dependencies["swagger-ui-express"] = "^4.1.6";
      json.dependencies["heroku-ssl-redirect"] = "^0.1.1";
      json.devDependencies["ts-node-dev"] = "^1.1.6";
      json.devDependencies["@types/pg"] = "^7.14.4";
      json.devDependencies["@types/express"] = "^4.16.1";
      json.devDependencies["@types/compression"] = "^1.7.0";
      json.devDependencies["@types/jsonwebtoken"] = "^8.5.1";
      json.devDependencies["@types/password-hash"] = "^1.2.20";
      json.devDependencies["@types/express-jwt"] = "^6.0.1";
      json.devDependencies["@types/swagger-ui-express"] = "^4.1.3";
      json.browser = {
        "jsonwebtoken": false,
        "password-hash": false
      };

      const angularMaterial = "@angular/material";
      let angularVersion = json.dependencies["@angular/core"];
      if (!json.dependencies[angularMaterial]) {
        json.dependencies[angularMaterial] = angularVersion;
      }

    });

  }
  function editJson(tree: Tree, path: string, edit: (j: any) => void) {
    let r = tree.read(path);
    let s = r!.toString('utf-8');
    let prev = '';
    if (s.startsWith('/*')) {
      let end = s.indexOf('{');
      prev = s.substring(0, end);
      s = s.substring(end);
    }
    let json = JSON.parse(s);
    if (!json)
      console.error("couldn't find json file: " + path);
    edit(json);
    tree.overwrite(path, prev + JSON.stringify(json, null, 2));
  }
  function editGitIgnore(tree: Tree) {
    let gitIgnorePath = './.gitignore';
    let r = tree.read(gitIgnorePath);
    let content = r!.toString('utf-8');
    content += '\r\n.env';
    content += '\r\ndb/';
    tree.overwrite(gitIgnorePath, content);

  }

  interface addToNdModuleParameters {
    declarations?: classToRegister[];
    imports?: classToRegister[];
    entryComponents?: classToRegister[];
    providers?: classToRegister[];
  }
  interface classToRegister {
    name: string,
    path: string
  }
  function addToNgModule(tree: Tree, what: addToNdModuleParameters) {
    var options: any = {};
    options.name = "stam";
    const workspace = getWorkspace(tree);
    const project = Object.values(workspace.projects)[0];
    if (options.path === undefined) {
      options.path = `/${project.root}/${project.sourceRoot}/${project.prefix}`;
    }
    options.module = findModuleFromOptions(tree, options);



    for (const iterator of [
      "imports",
      "declarations",
      "providers",
      "entryComponents"]) {
      if ((<any>what)[iterator]) {
        for (const d of (<any>what)[iterator]) {
          const text = tree.read(options.module);
          if (text === null) {
            throw new SchematicsException(`File ${options.module} does not exist!`);
          }
          const sourceText = text.toString('utf-8');
          var ngModel = ts.createSourceFile(options.module, sourceText, ts.ScriptTarget.Latest, true);
          var declarationChanges = addSymbolToNgModuleMetadata(ngModel, 'thePath', iterator, d.name, d.path);
          let trans = tree.beginUpdate(options.module);
          for (const c of declarationChanges) {
            if (c instanceof InsertChange) {
              trans.insertLeft(c.pos, c.toAdd);
            }
          }
          tree.commitUpdate(trans);
        }
      }
    }


  }
}


