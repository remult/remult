import { expect, test } from 'vitest'
import spawn, { sync } from 'cross-spawn'
import { emptyDir } from '../src/empty-dir'

function run(what: string, args: string[], where?: string) {
  const { status } = sync(what, args, {
    stdio: 'inherit',
    cwd: where,
  })
  return status
}

test('react', async () => {
  await testItBuildsAndRuns({
    template: 'react',
    port: 3002,
    checkStart: true,
  })
})
test.only('angular', async () => {
  await testItBuildsAndRuns({
    template: 'angular',
    port: 3002,
    checkStart: true,
  })
})

test('sveltekit', async () => {
  await testItBuildsAndRuns({
    template: 'sveltekit',
    port: 3000,
    checkStart: false,
  })
})

async function testItBuildsAndRuns({
  template,
  port,
  checkStart,
}: {
  template: string
  port?: number
  checkStart?: boolean
}) {
  emptyDir('tmp')

  expect(run('npx', ['create-remult', 'tmp', '--template=' + template])).toBe(0)
  expect(run('npm', ['install'], 'tmp')).toBe(0)
  expect(run('npm', ['run', 'build'], 'tmp')).toBe(0)
  if (checkStart) {
    var process = spawn('npm', ['start'], { cwd: 'tmp' })
    try {
      const result = await fetch('http://127.0.0.1:' + port)
      expect(result.status).toBe(200)
    } finally {
      process.kill()
    }
  }
}
