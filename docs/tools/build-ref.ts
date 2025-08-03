import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Copy core files to generate directory
const generateDir = path.join(__dirname, '../../dist/generate')
if (!fs.existsSync(generateDir)) {
  fs.mkdirSync(generateDir, { recursive: true })
}

// Copy core files
const coreDir = path.join(__dirname, '../../projects/core')
const copyRecursive = (src: string, dest: string): void => {
  if (fs.statSync(src).isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true })
    }
    const files = fs.readdirSync(src)
    for (const file of files) {
      copyRecursive(path.join(src, file), path.join(dest, file))
    }
  } else {
    fs.copyFileSync(src, dest)
  }
}

copyRecursive(coreDir, generateDir)

// Change to dist/generate directory
process.chdir(generateDir)

// Remove test files
const testDirs = ['src/backend-tests', 'src/tests', 'src/shared-tests']

for (const testDir of testDirs) {
  const fullPath = path.join(generateDir, testDir)
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true })
  }
}

// Remove specific test files
const testFiles = ['src/tests/test-data-api', 'src/live-query/*.spec.ts']

for (const testFile of testFiles) {
  const fullPath = path.join(generateDir, testFile)
  if (fs.existsSync(fullPath)) {
    if (fs.statSync(fullPath).isDirectory()) {
      fs.rmSync(fullPath, { recursive: true, force: true })
    } else {
      fs.unlinkSync(fullPath)
    }
  }
}

// Generate TypeDoc JSON
try {
  execSync(
    'npx typedoc index.ts server/index.ts migrations/index.ts async-hooks.ts --json the.json',
    {
      stdio: 'inherit',
      cwd: generateDir,
    },
  )
} catch (error) {
  console.error(
    'Error generating TypeDoc JSON:',
    error instanceof Error ? error.message : String(error),
  )
  process.exit(1)
}

// Return to original directory and run the TypeScript docs generation directly
process.chdir(path.join(__dirname, '../..'))
try {
  execSync('tsx ./docs/tools/docs-work.ts', { stdio: 'inherit' })
} catch (error) {
  console.error(
    'Error running docs generation:',
    error instanceof Error ? error.message : String(error),
  )
  process.exit(1)
}
