import { useState } from 'react'

export function Todo() {
  const [response, setResponse] = useState('')
  async function testTheApi() {
    try {
      const result = await fetch('/api/tasks')
      if (!result.ok) {
        setResponse(`Error: ${result.status} ${result.statusText}`)
      }
      try {
        const json = await result.json()
        setResponse(JSON.stringify(json, null, 2))
      } catch (err: any) {
        setResponse(
          `Error: the result is not a json, probably because the route wasn't found`,
        )
      }
    } catch (err: any) {
      setResponse(`Error: ${err.message}`)
    }
  }
  return (
    <div>
      <button onClick={testTheApi}>Test The Api</button>
      <main>
        <div>
          <h4>/api/tasks</h4>
        </div>
        <pre>
          result:
          <br />
          {response}
        </pre>
      </main>
    </div>
  )
}
