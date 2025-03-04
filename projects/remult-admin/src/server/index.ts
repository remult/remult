import express from 'express'
import { api } from './api'

export const app = express()
// app.use('/yop_yop', api)
app.use('/', api)
