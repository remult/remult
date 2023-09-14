import { parse } from '@babel/parser'
import * as recast from 'recast'
import { prettyPrint } from 'recast'
const { visit } = recast.types

export const transform = async (code: string) => {
  try {
    const codeParsed = parse(code ?? '', {
      plugins: ['typescript', 'importAssertions', 'decorators-legacy'],
      sourceType: 'module',
    }).program as recast.types.namedTypes.Program

    let transformed = false
    // Empty functions with @BackendMethod decorator and strip the decorator
    visit(codeParsed, {
      visitFunction(path) {
        // @ts-ignore
        const decorators: any[] = path.node.decorators || []
        let foundDecorator = false

        // Filter out the BackendMethod decorator
        // @ts-ignore
        path.node.decorators = decorators.filter((decorator) => {
          if (
            decorator.expression.callee &&
            decorator.expression.callee.name === 'BackendMethod'
          ) {
            foundDecorator = true
            // We actually need to keep the decorator
            // return false;
          }
          return true
        })

        // If the BackendMethod decorator was found, empty the function body
        if (foundDecorator) {
          transformed = true
          path.node.body.body = []
        }

        this.traverse(path)
      },
    })

    // remove imports only if we emptied some functions
    if (transformed) {
      const usedIdentifiersInCode = new Set()

      // Traverse the AST to identify used identifiers
      visit(codeParsed, {
        visitIdentifier(path) {
          // Let's not add identifiers from import specifiers
          if (path.parentPath.value.type !== 'ImportSpecifier') {
            usedIdentifiersInCode.add(path.node.name)
          }

          this.traverse(path)
        },
      })

      // Remove unused identifiers within import statements from the AST
      visit(codeParsed, {
        visitImportDeclaration(path) {
          const importSpecifiers = path.node.specifiers!.filter((specifier) =>
            usedIdentifiersInCode.has(specifier.local!.name),
          )

          if (importSpecifiers.length === 0) {
            // If no specifiers are left, prune the import statement
            path.prune()
          } else {
            // Update the import statement with the remaining specifiers
            path.node.specifiers = importSpecifiers
          }

          this.traverse(path)
        },
      })
    }

    return { ...prettyPrint(codeParsed, {}), transformed }
  } catch (error) {
    // if anything happens, just return the original code
    return { code, transformed: false }
  }
}
