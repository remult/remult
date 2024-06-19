export const priorityOptions = ['low', 'medium', 'high'] as const
export type Priority = (typeof priorityOptions)[number]
