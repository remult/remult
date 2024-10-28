export const OrderStatuses = [
  'created',
  'confirmed',
  'pending',
  'blocked',
  'delayed',
  'canceled',
  'completed',
] as const
export type OrderStatus = (typeof OrderStatuses)[number]
