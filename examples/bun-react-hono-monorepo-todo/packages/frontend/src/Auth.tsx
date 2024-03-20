// src/Auth.tsx

import { FormEvent, useEffect, useState } from "react"
import { remult } from "shared"
import App from "./App"

export default function Auth() {
  const [username, setUsername] = useState("")
  const [signedIn, setSignedIn] = useState(false)

  const signIn = async (e: FormEvent) => {
    e.preventDefault()
    const result = await fetch("/api/signIn", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username })
    })
    
    if (result.ok) {
      remult.user = await result.json()
      setSignedIn(true)
      setUsername("")
    } else {
      alert(await result.json())
    }
  }

  const signOut = async () => {
    await fetch("/api/signOut", {
      method: "POST"
    })
    remult.user = undefined
    setSignedIn(false)
  }
  useEffect(() => {
    try {
      fetch("/api/currentUser").then(async r => {
        remult.user = await r.json()
        if (remult.user) setSignedIn(true)
      })  
    } catch (error) {
      setSignedIn(false)
    }
    
  }, [])

  if (!signedIn)
    return (
      <>
        <h1>Todos</h1>
        <main>
          <form onSubmit={signIn}>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Username, try Steve or Jane"
            />
            <button>Sign in</button>
          </form>
        </main>
      </>
    )
  return (
    <>
      <header>
        Hello {remult.user!.name} <button onClick={signOut}>Sign Out</button>
      </header>
      <App />
    </>
  )
}