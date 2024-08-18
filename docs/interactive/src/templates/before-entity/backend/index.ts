import express from 'express'
import fs from 'fs'

export const app = express()
if (fs.existsSync('./db/tasks.json')) {
  fs.unlinkSync('./db/tasks.json')
  console.log('Deleted tasks.json')
}
