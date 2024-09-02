import { useState } from 'react'
import usePromise from 'react-use-promise'
import { repo } from 'remult'
import { Employee } from '../shared/model'

export function Todo() {
  const [result, error] = usePromise(() => repo(Employee).aggregate({}), [])
  return (
    <div>
      <h1>Aggregate</h1>
      <main>
        <div>count:{result?.$count}</div>
        {error && <div>Error: {error.message}</div>}
      </main>
    </div>
  )
}
