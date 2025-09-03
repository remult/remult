import express from 'express'
import { api } from './api.js'

export const app = express()
// app.use('/yop_yop', api)
app.use('/', api as express.RequestHandler)
