import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

let _defaultLocale = 'ar-EG'
let _defaultCurrency = 'EGP'

export function setCurrencyDefaults(locale: string, currency: string) {
  _defaultLocale = locale
  _defaultCurrency = currency
}

export function formatCurrency(amount?: number | null, locale?: string, currency?: string): string {
  const l = locale || _defaultLocale
  const c = currency || _defaultCurrency
  return new Intl.NumberFormat(l, { style: 'currency', currency: c }).format(amount ?? 0)
}

export function formatDistance(km: number): string {
  return `${km.toFixed(1)} km`
}

export function formatDuration(minutes: number): string {
  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hrs > 0) return `${hrs}h ${mins}m`
  return `${mins} min`
}

export function formatDate(date?: string | Date | null): string {
  if (!date) return '—'
  try {
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date))
  } catch {
    return '—'
  }
}

export function getInitials(name?: string | null): string {
  if (!name) return 'U'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}
