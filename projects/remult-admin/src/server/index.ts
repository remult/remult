import express from 'express'
import { api, bearerOf, users } from './api.js'

export const app = express()
// an unknown token is a 401, like a real auth layer would answer (the admin then asks for a new one)
app.use((req, res, next) => {
  const token = bearerOf(req)
  if (token && !Object.hasOwn(users, token)) {
    res.status(401).json({ message: 'Unknown token' })
    return
  }
  next()
})
// app.use('/yop_yop', api)
app.use('/', api as express.RequestHandler)
