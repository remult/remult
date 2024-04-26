export const labelOptions = [
  'bug',
  'feature',
  'enhancement',
  'documentation',
] as const
export type Label = (typeof labelOptions)[number]
