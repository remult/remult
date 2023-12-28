'use client'
import Image from 'next/image'
import styles from './page.module.css'
import { signIn, useSession } from 'next-auth/react'

export default function Home() {
  const session = useSession()

  return (
    <>
      <button onClick={() => signIn()}>Sign In</button>
      <pre>{JSON.stringify(session.data?.user, undefined)}</pre>
    </>
  )
}
