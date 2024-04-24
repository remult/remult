// src/routes/login.tsx

import { useSubmission } from "@solidjs/router"
import { loginAction } from "../auth.js"
import { Show } from "solid-js"

export default function Home() {
  const sub = useSubmission(loginAction)
  return (
    <>
      <h1>Login</h1>
      <main>
        <form action={loginAction} method="post">
          <input
            type="text"
            name="username"
            placeholder="Username, try Steve or Jane"
          />
          <button>Sign in</button>
        </form>
        <Show when={sub.result?.message}>{sub.result?.message}</Show>
      </main>
    </>
  )
}
