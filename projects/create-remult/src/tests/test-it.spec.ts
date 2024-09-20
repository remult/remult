import { expect, test, describe } from 'vitest'
import spawn, { sync } from 'cross-spawn'
import { emptyDir } from '../empty-dir'
import { setTimeout } from 'timers/promises'
import { FRAMEWORKS } from '../FRAMEWORKS'
import { DATABASES } from '../DATABASES'

function run(what: string, args: string[], where?: string) {
  const { status } = sync(what, args, {
    stdio: 'inherit',
    cwd: where,
  })
  return status
}
for (const fw of FRAMEWORKS) {
  for (const key in DATABASES) {
    if (Object.prototype.hasOwnProperty.call(DATABASES, key)) {
      test.concurrent('test ' + fw.name + ' with ' + key, async () => {
        await testItBuildsAndRuns({
          template: fw.name,
          database: key,
        })
      })
    }
  }
  break
}

// test('react', async () => {
//   await testItBuildsAndRuns({
//     template: 'react',

//     port: 3002,
//     checkStart: true,
//   })
// })
// test('vue', async () => {
//   await testItBuildsAndRuns({
//     template: 'vue',
//     port: 3002,
//     checkStart: true,
//   })
// })
// test('angular', async () => {
//   await testItBuildsAndRuns({
//     template: 'angular',
//     port: 3002,
//     checkStart: true,
//   })
// })
// test.only('netxjs', async () => {
//   await testItBuildsAndRuns({
//     template: 'nextjs',
//     port: 3000,
//     checkStart: true,
//   })
// })

// test('sveltekit', async () => {
//   await testItBuildsAndRuns({
//     template: 'sveltekit',
//     port: 3000,
//     checkStart: false,
//   })
// })

async function testItBuildsAndRuns({
  template,
  database,
  port,
  checkStart,
}: {
  template: string
  database?: string
  port?: number
  checkStart?: boolean
}) {
  const name = template + '-' + database
  if (!database) database = 'json'
  const dir = 'tmp/' + name
  emptyDir(dir)

  expect(
    run(
      'npx',
      [
        'create-remult',
        name,
        '--template=' + template,
        '--database=' + database,
      ],
      'tmp',
    ),
  ).toBe(0)
  expect(run('npm', ['install'], dir)).toBe(0)
  expect(run('npm', ['run', 'build'], dir)).toBe(0)
  if (checkStart && false) {
    var process = spawn('npm', ['start'], { cwd: dir })
    try {
      let result: Response = undefined!
      for (let index = 0; index < 5; index++) {
        try {
          result = await fetch('http://127.0.0.1:' + port)
          if (result.status == 200) return
        } catch (error) {
          await setTimeout(1000)
          console.log('waiting for server to start')
        }
      }
      expect(result?.status).toBe(200)
    } finally {
      process.kill()
    }
  }
}
