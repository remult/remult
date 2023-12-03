// import * as ts from 'typescript'
// import * as fs from 'fs'

// const sourceFile = getSourceFile('./projects/core/index.ts') // Replace './src/index.ts' with your source file path
// const apiDeclarations = extractPublicAPI(sourceFile)
// generateAPITextFile(apiDeclarations, './publicAPI.txt') // Replace './publicAPI.txt' with your desired output file path

// function getSourceFile(filePath: string): ts.SourceFile {
//   const host = ts.createCompilerHost({})

//   const program = ts.createProgram({
//     rootNames: [filePath],
//     options: {
//       noEmit: true,
//       target: ts.ScriptTarget.ES5,
//       module: ts.ModuleKind.CommonJS,
//       lib: ['lib.es2015.d.ts', 'lib.dom.d.ts'],
//     },
//     host,
//   })

//   return program.getSourceFile(filePath)
// }

// function extractPublicAPI(sourceFile: ts.SourceFile): ts.Node[] {
//   const declarations: ts.Node[] = []
//   function visit(node: ts.Node) {
//     if (ts.isExportSpecifier(node)) {
//       declarations.push(node)
//     }
//     ts.forEachChild(node, visit)
//   }
//   ts.forEachChild(sourceFile, visit)
//   return declarations
// }

// function generateAPITextFile(
//   apiDeclarations: ts.Node[],
//   outputFilePath: string,
// ) {
//   const apiText = apiDeclarations
//     .map((declaration) => declaration.getText(sourceFile))
//     .join('\n\n')
//   fs.writeFileSync(outputFilePath, apiText)
// }

import * as ts from 'typescript'
import * as fs from 'fs'
import * as path from 'path'

try {
  function isNodeExported(node: ts.Node): boolean {
    return (
      // True if this is a declaration with the 'export' or 'declare' modifier
      (ts.getCombinedModifierFlags(node as ts.Declaration) &
        ts.ModifierFlags.Export) !==
        0 ||
      (!!node.parent && node.parent.kind === ts.SyntaxKind.SourceFile)
    )
  }

  let result = ''
  const files = new Map<string, Map<string, ts.Node>>()

  function extractTypes(fileName: string, basePath: string, root?: boolean) {
    //result += `\n# ${fileName}: \n\n`

    const fileContents = fs.readFileSync(fileName, 'utf8')
    const sourceFile = ts.createSourceFile(
      fileName,
      fileContents,
      ts.ScriptTarget.Latest,
      true,
    )
    let depth = -1

    const resultTypes = new Map<string, ts.Node>()

    function visit(node: ts.Node): void {
      if (ts.isExportDeclaration(node)) {
        if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
          const modulePath = path.join(basePath, node.moduleSpecifier.text)
          let resolvedModulePath = require.resolve(modulePath)
          if (resolvedModulePath.endsWith('.js')) {
            resolvedModulePath =
              resolvedModulePath.substring(0, resolvedModulePath.length - 3) +
              '.d.ts'
          }
          let types = files.get(resolvedModulePath)
          if (!types) {
            files.set(
              resolvedModulePath,
              (types = extractTypes(
                resolvedModulePath,
                path.dirname(resolvedModulePath),
              )),
            )
          }
          for (const exportElement of node.exportClause?.elements ?? []) {
            const name = exportElement.name?.text
            if (!name) {
              debugger
            }
            const type = types.get(name)
            if (type) {
              resultTypes.set(name, type)
            } else debugger
          }
        }
      } else if (
        ts.isImportDeclaration(node) ||
        ts.isExportSpecifier(node) ||
        ts.isInterfaceDeclaration(node) ||
        ts.isFunctionDeclaration(node) ||
        ts.isTypeAliasDeclaration(node) ||
        ts.isClassDeclaration(node) ||
        true
      ) {
        const name = node.name?.text
        if (name && isNodeExported(node)) {
          resultTypes.set(name, node)
          if (false)
            result +=
              ' '.repeat(depth * 2) +
              `${isNodeExported(node)}   ${ts.SyntaxKind[node.kind]}: ${name}\n`
        }
      }
      depth++
      ts.forEachChild(node, visit)
      depth--
    }
    let checkedTypes = new Set<string>([
      'Required',
      'Partial',
      'Pick',
      'Omit',
      'Record',
      'Exclude',
      'Extract',
      'NonNullable',
      'Parameters',
      'ConstructorParameters',
      'ReturnType',
      'InstanceType',
      'Require',
      'Date',
      'VoidFunction',
      'Promise',
      'fetch',
    ])

    visit(sourceFile)
    // result += '\n# End of ' + fileName + '\n'
    if (root) {
      result += '```ts\n'
      for (const type of [...resultTypes.keys()].sort((a, b) =>
        a.localeCompare(b),
      )) {
        let node = resultTypes.get(type)

        if (ts.isVariableDeclaration(node)) {
          result += 'export const '
        }
        result += `${node.getText()}\n`

        iterateAllTypes(node)
        function checkType(node: ts.TypeNode) {
          if (ts.isTypeLiteralNode(node)) {
            node.members.forEach((m) => iterateAllTypes(m))
          } else if (ts.isArrayTypeNode(node)) {
            checkType(node.elementType)
          } else if (ts.isTypeQueryNode(node)) {
            checkName(node.exprName.getText())
          } else if (ts.isFunctionTypeNode(node)) {
            node.parameters.forEach((p) => checkType(p.type))
            checkType(node.type)
          } else if (ts.isUnionTypeNode(node)) {
            node.types.forEach((t) => checkType(t))
          } else if (ts.isMappedTypeNode(node)) {
            checkType(node.type)
          } else if (ts.isTypeReferenceNode(node)) {
            let name = node.typeName.getText()
            let pType = ts.SyntaxKind[node.parent.kind]
            let p1Type = ts.SyntaxKind[node.parent.parent.kind]
            let p2Type = ts.SyntaxKind[node.parent.parent.parent.kind]
            checkName(name)
          } else if (ts.isParenthesizedTypeNode(node)) {
            checkType(node.type)
          } else if (
            [
              ts.SyntaxKind.AnyKeyword,
              ts.SyntaxKind.UnknownKeyword,
              ts.SyntaxKind.BooleanKeyword,
              ts.SyntaxKind.StringKeyword,
              ts.SyntaxKind.NumberKeyword,
              ts.SyntaxKind.VoidKeyword,
              ts.SyntaxKind.UndefinedKeyword,
            ].includes(node.kind)
          ) {
          } else {
            let theType = ts.SyntaxKind[node.kind]
            let name = node.name?.text

            if (!name) {
              name = theType
            }
            checkName(name)
          }

          function checkName(name: string) {
            if (name == 'T') {
              debugger
            }
            if (!resultTypes.has(name) && !checkedTypes.has(name)) {
              result += `//[ ] ${name} is not exported\n`
              checkedTypes.add(name)
            }
          }
        }

        function iterateAllTypes(node: ts.Node): void {
          if (ts.isVariableDeclaration(node) && node.type) {
            checkType(node.type)
          }

          // Handle function return types
          if (ts.isFunctionDeclaration(node) && node.type) {
            checkType(node.type)
          }

          // Handle parameters in functions
          if (ts.isParameter(node) && node.type) {
            checkType(node.type)
          }

          // Handle type references
          if (ts.isTypeReferenceNode(node)) {
            checkType(node)
          }

          // Handle composite types (union and intersection)
          if (ts.isUnionTypeNode(node) || ts.isIntersectionTypeNode(node)) {
            node.types.forEach((typeNode) => checkType(typeNode))
          }

          // Handle base types in class/interface declarations
          if (
            (ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)) &&
            node.heritageClauses
          ) {
            node.heritageClauses.forEach((clause) => {
              clause.types.forEach((type) => checkType(type))
            })
          }

          ts.forEachChild(node, iterateAllTypes)
        }
      }

      result += '```'
    }

    return resultTypes
  }

  // Replace 'index.ts' with the path to your file
  extractTypes('./dist/remult/index.d.ts', './dist/remult/', true)
  fs.writeFileSync('types.md', result)
} catch (err) {
  console.error(err)
}
