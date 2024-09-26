import { type FormEvent, useEffect, useState } from 'react'
import { remult, type UserInfo, type ErrorInfo } from 'remult'
import { Todo } from './Todo'
import { AuthController } from '../shared/AuthController'

export function Auth() {
  const [name, setName] = useState('')
  const [currentUser, setCurrentUser] = useState<UserInfo>()

  async function signIn(f: FormEvent<HTMLFormElement>) {
    f.preventDefault()
    try {
      setCurrentUser((remult.user = await AuthController.signIn(name)))
    } catch (error) {
      alert((error as ErrorInfo).message)
    }
  }
  async function signOut() {
    setCurrentUser(await AuthController.signOut())
  }
  useEffect(() => {
    remult.initUser().then(setCurrentUser)
  }, [])

  if (!currentUser)
    return (
      <>
        <main className="sign-in">
          <h2>Sign In</h2>
          <form onSubmit={signIn}>
            <label>Name</label>
            <input
              placeholder="Try Alex or Jane"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button>Sign in</button>
          </form>
        </main>
      </>
    )
  return (
    <>
      <div>
        Hello {currentUser?.name} <button onClick={signOut}>Sign Out</button>
      </div>
      <Todo />
    </>
  )
}
