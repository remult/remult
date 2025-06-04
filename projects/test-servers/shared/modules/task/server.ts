import { Module } from '../../../../core/server'
import { Task } from './Task.js'

export const taskModule = new Module({
  key: 'task-module',
  entities: [Task],
})
