import { Task } from './Task'

export const TaskPriorities = ['low', 'medium', 'high'] as const
export type TaskPriority = (typeof TaskPriorities)[number]
