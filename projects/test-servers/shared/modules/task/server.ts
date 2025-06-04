import { Module } from '../../../../core/server/index.js'
import { Task } from './Task.js'

export const taskModule = new Module({
  key: 'task-module',
  entities: [Task],
})