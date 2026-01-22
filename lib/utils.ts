import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function convertTitleCase(text: string) {
  return text.toLowerCase().replace(/\b\w/g, (s) => s.toUpperCase())
}

export function getApiBaseUrl(): string {
  if (!process.env.NEXT_PUBLIC_SHAPED_API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_SHAPED_API_BASE_URL must be set")
  }
  return process.env.NEXT_PUBLIC_SHAPED_API_BASE_URL
}

export const parseCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null
  const cookies = document.cookie.split(";").map((cookie) => cookie.trim())
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.split("=")
    if (cookieName === name) {
      return decodeURIComponent(cookieValue)
    }
  }
  return null
}

export function formatNumber(v: number, precision?: number): string {
  const formatValue = (value: number): string =>
    precision !== undefined
      ? parseFloat(value.toFixed(precision)).toString()
      : value.toString()

  if (precision !== undefined) {
    return v < 10000
      ? formatValue(v)
      : v < 1000000
        ? `${formatValue(v / 1000)}K`
        : v < 1000000000
          ? `${formatValue(v / 1000000)}M`
          : `${formatValue(v / 1000000000)}B`
  } else {
    return v < 10000
      ? formatValue(v)
      : v < 1000000
        ? `${v / 1000}K`
        : v < 1000000000
          ? `${v / 1000000}M`
          : `${v / 1000000000}B`
  }
}
