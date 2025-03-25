import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(value: number | string, decimal: number = 0): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return num.toFixed(decimal).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}
