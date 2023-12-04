import * as ts from 'typescript'
import * as fs from 'fs'
import * as path from 'path'
import * as prettier from 'prettier'

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
    if (fileName.endsWith('.js')) {
      fileName = fileName.substring(0, fileName.length - 3) + '.d.ts'
    }

    const fileContents = fs.readFileSync(fileName, 'utf8')
    const sourceFile = ts.createSourceFile(
      fileName,
      fileContents,
      ts.ScriptTarget.Latest,
      true,
    )
    let depth = -1

    const resultTypes = new Map<string, ts.Node>()
    let okTypes = new Set<string>([
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
      'Array',
      'Number',
      'IterableIterator',
      'IteratorResult',
      'GetArguments',
      'Boolean',
      'String',
      'express.RequestHandler',
      'express.Response',
      'express.Request',
      'Request',
      'Response',
    ])
    const otherImports = new Map<string, string>()

    function visit(node: ts.Node): void {
      if (ts.isExportDeclaration(node)) {
        if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
          const modulePath = path.join(basePath, node.moduleSpecifier.text)
          let resolvedModulePath = require.resolve(modulePath)

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
          node.exportClause?.forEachChild((exportElement) => {
            const name = getName(exportElement)
            if (!name) {
              debugger
            }
            const type = types.get(name)
            if (type) {
              resultTypes.set(name, type)
            } else debugger
          })
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
        const name = getName(node)
        if (name && isNodeExported(node)) {
          resultTypes.set(name, node)
          if (false)
            result +=
              ' '.repeat(depth * 2) +
              `${isNodeExported(node)}   ${ts.SyntaxKind[node.kind]}: ${name}\n`
        } else if (root && ts.isImportDeclaration(node)) {
          let i = node
          let moduleSpecifier = i.moduleSpecifier.getText().replace(/'/g, '')

          if (
            (!moduleSpecifier.startsWith(`.`) ||
              ['./index'].includes(moduleSpecifier)) &&
            node.importClause?.namedBindings
          ) {
            node.importClause.namedBindings.forEachChild((e) => {
              if (ts.isImportSpecifier(e)) {
                okTypes.add(e.name.text)
              }
            })
          } else {
            node.importClause?.namedBindings?.forEachChild((e) => {
              if (ts.isImportSpecifier(e)) {
                otherImports.set(e.name.text, moduleSpecifier)
              }
            })
          }
        }
      }
      depth++
      ts.forEachChild(node, visit)
      depth--
    }

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
          if (ts.isLiteralTypeNode(node)) {
            iterateAllTypes(node.literal)
          } else if (ts.isExpressionWithTypeArguments(node)) {
            iterateAllTypes(node.expression)
          } else if (ts.isConditionalTypeNode(node)) {
            checkType(node.extendsType)
            checkType(node.trueType)
            checkType(node.falseType)
          } else if (ts.isIntersectionTypeNode(node)) {
            node.types.forEach((t) => checkType(t))
          } else if (ts.isTypeLiteralNode(node)) {
            node.members.forEach((m) => iterateAllTypes(m))
          } else if (ts.isArrayTypeNode(node)) {
            checkType(node.elementType)
          } else if (ts.isTypeQueryNode(node)) {
            checkName(node.exprName.getText())
          } else if (ts.isFunctionTypeNode(node)) {
            var f = node
            f.parameters.forEach((p) => checkType(p.type))
            checkType(node.type)
          } else if (ts.isUnionTypeNode(node)) {
            node.types.forEach((t) => checkType(t))
          } else if (ts.isMappedTypeNode(node)) {
            checkType(node.type)
          } else if (ts.isTypeReferenceNode(node)) {
            let name = node.typeName.getText()
            checkName(name)
          } else if (ts.isParenthesizedTypeNode(node)) {
            checkType(node.type)
          } else if (ts.isTypeOperatorNode(node)) {
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
              ts.SyntaxKind.NeverKeyword,
              ts.SyntaxKind.SymbolKeyword,
            ].includes(node.kind)
          ) {
          } else {
            let theType = ts.SyntaxKind[node.kind]
            let name = getName(node)

            if (!name) {
              name = theType
            }
            checkName(name)
          }

          function checkName(name: string) {
            if (!resultTypes.has(name) && !okTypes.has(name)) {
              let p = node.parent

              while (p) {
                let tp = (p as ts.SignatureDeclarationBase).typeParameters
                if (tp) {
                  let found = tp.find((t) => t.name.text == name)
                  if (found) return
                }
                if (ts.isConditionalTypeNode(p)) {
                  if (ts.isIndexedAccessTypeNode(p.checkType)) {
                    if (ts.isTypeReferenceNode(p.checkType.indexType)) {
                      if (p.checkType.indexType.typeName.getText() == name) {
                        return
                      }
                    }
                  }
                }
                if (ts.isMappedTypeNode(p)) {
                  if (p.typeParameter.name.text == name) {
                    return
                  }
                }
                p = p.parent
              }
              let from = otherImports.get(name)
              if (!from) {
                from = 'TBD'
              }
              result += `//[ ] ${name} from ${from} is not exported\n`
              okTypes.add(name)
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

      result += '```\n\n'
    }

    return resultTypes
  }

  const rootPath = `./dist/remult/`
  const packageJson = JSON.parse(
    fs.readFileSync(rootPath + 'package.json').toString(),
  )
  result += `# Public API\n`
  for (const key in packageJson.exports) {
    if (Object.prototype.hasOwnProperty.call(packageJson.exports, key)) {
      try {
        const element = packageJson.exports[key]
        const fileName = element.require
        const fullFileName = path.join(rootPath, fileName)
        result += `## ${fileName}\n`
        console.log(fullFileName)
        extractTypes(fullFileName, path.dirname(fullFileName), true)
      } catch (err) {
        result += `//[ ] !!! ${err}\n`
      }
    }
  }

  prettier
    .format(result, {
      parser: 'markdown',
      semi: false,
    })
    .then((result) => fs.writeFileSync('types.md', result))
} catch (err) {
  console.error(err)
}
export function getName(node: ts.Node): string {
  //@ts-ignore
  return node.name?.text
}
