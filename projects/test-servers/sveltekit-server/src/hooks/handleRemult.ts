import { remultSveltekit } from 'remult/remult-sveltekit'
import { Task } from '../shared/Task'

export const handleRemult = remultSveltekit({
  entities: [Task],
})
