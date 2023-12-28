import * as fs from 'fs'
import * as path from 'path'

function copyFiles(srcDir: string, destDir: string): void {
  // Ensure the destination directory exists
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true })
  }

  // Read all files and folders from source directory
  const entries = fs.readdirSync(srcDir, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name)
    const destPath = path.join(destDir, entry.name)

    if (entry.isDirectory()) {
      // Recursive call for directories
      copyFiles(srcPath, destPath)
    } else {
      // Copy file
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

const srcDirectory = path.resolve(process.cwd(), '../../../dist/remult')
const destDirectory = path.resolve(process.cwd(), './node_modules/remult')

copyFiles(srcDirectory, destDirectory)
