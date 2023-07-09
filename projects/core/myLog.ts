export async function writeToLog(what: any) {
  if (typeof what !== 'string') what = JSON.stringify(what, undefined, 2)
  ;(await import('fs')).appendFileSync('./tmp/test.log', what + '\n')
}
