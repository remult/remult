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
    _context.addTask(new RunSchematicTask('@angular/material/schematics/collection.json', 'ng-add', { gestures: true, animations: true }), [installTaskId]);
    editJson(tree, "./tsconfig.json", j => {
      j.include = ["./src/main.ts", "./src/polyfills.ts"];
    });

    editGitIgnore(tree);
    let entryComponents = [{ name: 'YesNoQuestionComponent', path: './common/yes-no-question/yes-no-question.component' },
    { name: 'SignInComponent', path: './common/sign-in/sign-in.component' },
    { name: 'SelectPopupComponent', path: './common/select-popup/select-popup.component' },
    { name: 'InputAreaComponent', path: './common/input-area/input-area.component' }
    ];

    addToNgModule(tree, {
      declarations: [
        { name: 'UsersComponent', path: './users/users.component' },
        { name: 'UpdateInfoComponent', path: './users/update-info/update-info.component' },
        { name: 'RegisterComponent', path: './users/register/register.component' },

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
        { name: 'RadWebModule', path: 'radweb' },
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
          element.architect.serve.options.proxyConfig = "proxy.conf.json";
          //remove when we remove bootstrap
          element.architect.build.options.styles.push("./node_modules/bootstrap3/dist/css/bootstrap.min.css");
          return;
        }
      }
    });


    tree.delete('./src/app/app.component.html');
    tree.delete('./src/app/app.component.spec.ts');
    tree.delete('./src/app/app.component.ts');
    tree.delete('./src/app/app.component.scss');
    tree.delete('./src/app/app-routing.module.ts');





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
      json.scripts["ng:dev"] = json.scripts.start;
      json.scripts["ng:build"] = "ng build --prod";
      json.scripts["build"] = "npm run server:build && npm run ng:build";
      json.scripts.start = "node dist-server/server/server.js";
      json.scripts["server:build-watch"] = "tsc -p tsconfig.server.json --watch";
      json.scripts["server:build"] = "tsc -p tsconfig.server.json";
      json.scripts["server:build"] = "tsc -p tsconfig.server.json";
      json.scripts["server:debug"] = "node --inspect --debug-brk dist-server/server/server.js";
      json.dependencies["bootstrap3"] = "^3.3.5";
      json.dependencies["dotenv"] = "^8.1.0";
      json.dependencies["password-hash"] = "^1.2.2";
      json.dependencies["radweb"] = "^3.0.11";
      json.dependencies["radweb-server"] = "^3.0.4";
      json.dependencies["radweb-server-postgres"] = "^3.0.1";
      json.dependencies["@angular/material"] = "^7.3.4";
      json.dependencies["pg"] = "^7.6.1";
      json.dependencies["express-force-https"] = "^1.0.0";
      json.dependencies["jsonwebtoken"] = "^8.5.1";
      json.dependencies["@auth0/angular-jwt"]="3.0.0";
    });

  }
  function editJson(tree: Tree, path: string, edit: (j: any) => void) {
    let r = tree.read(path);
    let json = JSON.parse(r!.toString('utf-8'));
    edit(json);
    tree.overwrite(path, JSON.stringify(json, null, 2));
  }
  function editGitIgnore(tree: Tree) {
    let gitIgnorePath = './.gitignore';
    let r = tree.read(gitIgnorePath);
    let content = r!.toString('utf-8');
    content += '\r\n.env\r\ndist-server/*';
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
    if (!options.project) {
      options.project = Object.keys(workspace.projects)[0];
    }
    const project = workspace.projects[options.project];
    if (options.path === undefined) {
      const projectDirName = project.projectType === 'application' ? 'app' : 'lib';
      options.path = `/${project.root}/src/${projectDirName}`;
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


