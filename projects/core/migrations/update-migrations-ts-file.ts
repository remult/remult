// consider replacing with https://www.npmjs.com/package/ts-morph
import * as ts from 'typescript'
import * as fs from 'fs'

export async function updateMigrationsFile(filePath: string, steps: string[]) {
  let maxStep = -1

  function buildSteps() {
    return steps.map((step) =>
      ts.factory.createPropertyAssignment(
        ts.factory.createIdentifier((++maxStep).toString()),
        ts.factory.createIdentifier(step),
      ),
    )
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '')
  }

  const importPath = 'remult/migrations'
  const importName = 'Migrations'
  // Load the file
  const sourceFile = ts.createSourceFile(
    filePath,
    fs.readFileSync(filePath).toString(),
    ts.ScriptTarget.Latest,
    true,
  )
  let migrationsExportFound = false
  // Find the "migrations" named export and add the new member
  let updatedSourceFile = ts.transform(sourceFile, [
    (context) => {
      return (node: ts.Node): ts.Node => {
        const visitor: ts.Visitor = (node) => {
          if (
            ts.isVariableStatement(node) &&
            node.declarationList.declarations.length > 0
          ) {
            const declaration = node.declarationList.declarations[0]
            if (
              ts.isIdentifier(declaration.name) &&
              declaration.name.text === 'migrations' &&
              declaration.initializer &&
              ts.isObjectLiteralExpression(declaration.initializer)
            ) {
              migrationsExportFound = true

              declaration.initializer.properties.forEach((property) => {
                if (ts.isPropertyAssignment(property)) {
                  if (ts.isNumericLiteral(property.name)) {
                    const step = parseInt(property.name.text)
                    if (step > maxStep) {
                      maxStep = step
                    }
                  }
                }
              })
              let steps: ts.PropertyAssignment[] = buildSteps()
              // Found the "migrations" array

              // Update the initializer with the new steps
              const updatedInitializer =
                ts.factory.updateObjectLiteralExpression(
                  declaration.initializer,
                  [...declaration.initializer.properties, ...steps],
                )

              // Update the declaration with the new initializer
              const updatedDeclaration = ts.factory.updateVariableDeclaration(
                declaration,
                declaration.name,
                undefined,
                declaration.type, // Preserve the original type annotation if present
                updatedInitializer,
              )
              return ts.factory.updateVariableStatement(
                node,
                node.modifiers,
                ts.factory.updateVariableDeclarationList(node.declarationList, [
                  updatedDeclaration,
                ]),
              )
            }
          }
          return ts.visitEachChild(node, visitor, context)
        }
        return ts.visitNode(node, visitor)!
      }
    },
  ]).transformed[0] as ts.SourceFile

  if (!migrationsExportFound) {
    let importFound = false

    // Check if the import statement already exists
    sourceFile.statements.forEach((statement) => {
      if (
        ts.isImportDeclaration(statement) &&
        ts.isStringLiteral(statement.moduleSpecifier) &&
        statement.moduleSpecifier.text === `${importPath}`
      ) {
        statement.importClause?.namedBindings?.forEachChild((namedBinding) => {
          if (
            ts.isImportSpecifier(namedBinding) &&
            namedBinding.name.text === importName
          ) {
            importFound = true
          }
        })
      }
    })

    // If the import statement doesn't exist, create it
    if (!importFound) {
      updatedSourceFile = ts.factory.updateSourceFile(updatedSourceFile, [
        ts.factory.createExpressionStatement(
          ts.factory.createIdentifier(
            `import type { ${importName} } from '${importPath}'`,
          ),
        ),
        ...updatedSourceFile.statements,
      ])
    }

    // Create a new export for migrations if it doesn't exist
    const newMigrationsExport = ts.factory.createVariableStatement(
      [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      ts.factory.createVariableDeclarationList(
        [
          ts.factory.createVariableDeclaration(
            'migrations',
            undefined, // You can add a type annotation here if needed
            ts.factory.createTypeReferenceNode(importName, undefined),
            ts.factory.createObjectLiteralExpression(buildSteps(), false),
          ),
        ],
        ts.NodeFlags.Const,
      ),
    )

    // Add the new export to the end of the file
    updatedSourceFile = ts.factory.updateSourceFile(updatedSourceFile, [
      ...updatedSourceFile.statements,
      newMigrationsExport,
    ])
  }
  let code = ts.createPrinter().printFile(updatedSourceFile)
  try {
    let prettier: any
    try {
      prettier = await import('prettier' + '')
    } catch (err) {
      console.warn(
        'error importing prettier,for better formatting run `npm i -D prettier`. Writing raw code to file.',
      )
    }
    if (prettier) {
      let options = await prettier.resolveConfig()
      code = await prettier.format(code, {
        ...options,
        parser: 'typescript',
      })
    }
  } catch (err) {
    console.log('error formatting code, writing raw code to file.')
  }

  fs.writeFileSync(filePath, code)
}
