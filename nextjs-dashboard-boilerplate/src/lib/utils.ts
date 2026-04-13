import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function compactWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

export function toTitleCase(value: string) {
  return compactWhitespace(value)
    .replace(/[-_]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function slugify(value: string) {
  return compactWhitespace(value)
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getInitials(value: string, maxLength = 2) {
  const words = compactWhitespace(value).split(' ').filter(Boolean)
  if (words.length === 0) {
    return ''
  }

  return words
    .slice(0, maxLength)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
}

export function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
