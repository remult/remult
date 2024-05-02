// src/routes/index.tsx

import { getUser, logout } from "../auth.js"
import { useNavigate } from "@solidjs/router"
import { Show, createSignal, onMount } from "solid-js"
import { remult } from "remult"
import Todo from "../components/Todo.jsx"

export default function Home() {
  const [authenticated, setAuthenticated] = createSignal(false)
  const navigate = useNavigate()

  onMount(async () => {
    remult.user = await getUser()
    if (remult.authenticated()) setAuthenticated(true)
    else navigate("/login")
  })

  return (
    <Show when={authenticated()}>
      <h1>Todos</h1>
      <header>
        Hello {remult.user?.name}
        <button onClick={async () => logout().then(() => navigate("/login"))}>
          Logout
        </button>
      </header>
      <Todo />
    </Show>
  )
}
