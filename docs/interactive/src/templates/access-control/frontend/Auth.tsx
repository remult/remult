import { useEffect, useState } from 'react'
import { remult, type ErrorInfo } from 'remult'
import { Todo } from './Todo'
import { AuthController } from '../shared/AuthController'

export function Auth() {
  const [loading, setLoading] = useState(true)

  async function doWhileLoading<T>(what: () => Promise<T>) {
    setLoading(true)
    try {
      return await what()
    } catch (error) {
      alert((error as ErrorInfo).message)
    } finally {
      setLoading(false)
    }
  }

  async function signIn(username: string) {
    await doWhileLoading(
      async () => (remult.user = await AuthController.signIn(username)),
    )
  }
  async function signOut() {
    await doWhileLoading(async () => {
      await AuthController.signOut()
      remult.user = undefined
    })
  }
  useEffect(() => {
    doWhileLoading(() => remult.initUser())
  }, [])
  if (loading) return <center>Loading...</center>

  return (
    <>
      <main>
        <div>
          {remult.authenticated() ? (
            <>
              Hello {remult.user?.name}{' '}
              <button onClick={signOut}>Sign Out</button>
            </>
          ) : (
            <>
              <button onClick={() => signIn('Alex')}>Sign in as Alex</button>
              <button onClick={() => signIn('Jane')}>
                Sign in as Jane (admin)
              </button>
            </>
          )}
        </div>
      </main>
      <Todo />
      <center>
        <a href="/api/admin#/entity/tasks">Remult Admin UI</a>
      </center>
    </>
  )
}
