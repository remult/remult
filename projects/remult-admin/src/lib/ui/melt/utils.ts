/**
 * A utility function that converts a style object to a string.
 *
 * @param style - The style object to convert
 * @returns The style object as a string
 */
export function styleToString(style: StyleObject): string {
  return Object.keys(style).reduce((str, key) => {
    if (style[key] === undefined) return str
    return str + `${key}:${style[key]};`
  }, '')
}

export type StyleObject = Record<string, number | string | undefined>

import { cubicOut } from 'svelte/easing'
import type { TransitionConfig } from 'svelte/transition'

const scaleConversion = (
  valueA: number,
  scaleA: [number, number],
  scaleB: [number, number],
) => {
  const [minA, maxA] = scaleA
  const [minB, maxB] = scaleB

  const percentage = (valueA - minA) / (maxA - minA)
  const valueB = percentage * (maxB - minB) + minB

  return valueB
}

type FlyAndScaleOptions = {
  y: number
  start: number
  duration?: number
}
export const flyAndScale = (
  node: HTMLElement,
  options: FlyAndScaleOptions,
): TransitionConfig => {
  const style = getComputedStyle(node)
  const transform = style.transform === 'none' ? '' : style.transform

  return {
    duration: options.duration ?? 150,
    delay: 0,
    css: (t) => {
      const y = scaleConversion(t, [0, 1], [options.y, 0])
      const scale = scaleConversion(t, [0, 1], [options.start, 1])

      return styleToString({
        transform: `${transform} translate3d(0, ${y}px, 0) scale(${scale})`,
        opacity: t,
      })
    },
    easing: cubicOut,
  }
}
