export const statusOptions = [
  'todo',
  'in-progress',
  'done',
  'canceled',
] as const
export type Status = (typeof statusOptions)[number]
