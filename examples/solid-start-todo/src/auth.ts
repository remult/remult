// src/auth.ts

import { action, redirect } from "@solidjs/router"
import { useSession } from "vinxi/http"
import { type UserInfo } from "remult"

const validUsers: UserInfo[] = [
  { id: "1", name: "Jane", roles: ["admin"] },
  { id: "2", name: "Steve" },
]

export async function getSession() {
  "use server"
  return await useSession<{ user?: UserInfo }>({
    password:
      process.env["SESSION_SECRET"] ||
      "Something secret used for development only",
  })
}

export const loginAction = action(async (formData: FormData) => {
  "use server"
  const username = String(formData.get("username"))
  try {
    const session = await getSession()
    const user = validUsers.find((x) => x.name === username)
    if (!user) throw Error("Invalid user, try 'Steve' or 'Jane'")
    await session.update({ user })
  } catch (err) {
    return err as Error
  }
  throw redirect("/")
}, "login")

export async function logout() {
  "use server"
  const session = await getSession()
  await session.update({ user: null! })
}

export async function getUser() {
  "use server"
  const session = await getSession()
  return session?.data?.user
}
