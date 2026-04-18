import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrencyBRL(value: number, isPrivate = false) {
  if (isPrivate) return 'R$ ••••••'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatPercent(
  value: number,
  options: Intl.NumberFormatOptions = {},
) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    ...options,
  }).format(value / 100)
}

export function parseCurrencyBRL(value: string): number {
  if (!value) return 0
  if (typeof value === 'number') return value

  const cleanValue = value.toString().replace(/[R$\s.]/g, '')
  const dotValue = cleanValue.replace(',', '.')
  const number = parseFloat(dotValue)
  return isNaN(number) ? 0 : number
}

export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export function abbreviateName(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return name
  const first = parts[0]
  const last = parts[parts.length - 1]
  // Return format: F. Reis
  return `${first.charAt(0)}. ${last}`
}

export function stringToColor(str: string): string {
  if (!str) return 'hsl(0, 0%, 50%)'
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  // Returns a vibrant color with good contrast
  return `hsl(${hue}, 75%, 55%)`
}
