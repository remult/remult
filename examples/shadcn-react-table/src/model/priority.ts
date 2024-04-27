import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
} from '@radix-ui/react-icons'
import type { ComponentType } from 'react'
import { ValueListFieldType } from 'remult'

@ValueListFieldType()
export class Priority {
  static low = new Priority(ArrowDownIcon)
  static medium = new Priority(ArrowRightIcon)
  static high = new Priority(ArrowUpIcon)
  constructor(public readonly icon: ComponentType) {}
  id!: string
  caption!: string
}
