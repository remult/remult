import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

export interface CodeStep {
  id: string
  name: string
  files: {
    name: string
    content: string
  }[]
}

export function loadCodeSamples(basePath: string): CodeStep[] {
  const steps: CodeStep[] = []

  const dirs = readdirSync(basePath)
    .filter((dir) => dir.match(/^\d+-/))
    .sort()

  for (const dir of dirs) {
    const stepPath = join(basePath, dir)
    const files = readdirSync(stepPath).filter(
      (file) => file.endsWith('.ts') || file.endsWith('.tsx'),
    )

    const stepFiles = files.map((file) => ({
      name: file,
      content: readFileSync(join(stepPath, file), 'utf-8'),
    }))

    steps.push({
      id: dir,
      name: dir.replace(/^\d+-/, '').replace(/-/g, ' '),
      files: stepFiles,
    })
  }

  return steps
}
