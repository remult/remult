import * as ts from 'typescript'
import * as fs from 'fs'

const sourceFile = getSourceFile('../projects/core/index.ts') // Replace './src/index.ts' with your source file path
const apiDeclarations = extractPublicAPI(sourceFile)
generateAPITextFile(apiDeclarations, './publicAPI.txt') // Replace './publicAPI.txt' with your desired output file path

function getSourceFile(filePath: string): ts.SourceFile {
  const host = ts.createCompilerHost({})

  const program = ts.createProgram({
    rootNames: [filePath],
    options: {
      noEmit: true,
      target: ts.ScriptTarget.ES5,
      module: ts.ModuleKind.CommonJS,
      lib: ['lib.es2015.d.ts', 'lib.dom.d.ts'],
    },
    host,
  })

  return program.getSourceFile(filePath)
}

function extractPublicAPI(sourceFile: ts.SourceFile): ts.Node[] {
  const declarations: ts.Node[] = []
  function visit(node: ts.Node) {
    if (ts.isExportSpecifier(node)) {
      declarations.push(node)
    }
    ts.forEachChild(node, visit)
  }
  ts.forEachChild(sourceFile, visit)
  return declarations
}

function generateAPITextFile(
  apiDeclarations: ts.Node[],
  outputFilePath: string,
) {
  const apiText = apiDeclarations
    .map((declaration) => declaration.getText(sourceFile))
    .join('\n\n')
  fs.writeFileSync(outputFilePath, apiText)
}
